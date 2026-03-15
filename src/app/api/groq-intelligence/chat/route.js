import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import prisma from '@/lib/db';
import { encrypt, decrypt } from '@/lib/encryption';
import { trackApiHit } from '@/lib/monitoring';

const getUserId = async () => {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) return null;

    try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);
        return payload.sub;
    } catch {
        return null;
    }
};

export async function POST(request) {
    try {
        const userId = await getUserId();
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await trackApiHit('/api/groq-intelligence/chat');

        const body = await request.json();
        const { messages, model = "llama-3.3-70b-versatile", sessionId, maxTokens, responseLength = 'short' } = body;

        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return NextResponse.json({ error: 'Messages array is required' }, { status: 400 });
        }

        // 1. Get user credentials
        const cred = await prisma.groqCredential.findUnique({
            where: { userId }
        });

        if (!cred) {
            return NextResponse.json({ error: 'Groq API Key not found. Please set one up first.' }, { status: 400 });
        }

        // 2. Decrypt key
        const apiKey = decrypt(cred.apiKey);

        // 3. Best Practice: Delay 200ms to prevent throttle burst
        await new Promise(r => setTimeout(r, 200));

        // Inject a system prompt to constrain the length if "short" is selected
        const systemPrompt = responseLength === 'short'
            ? 'You are a helpful assistant. Please keep your answers concise, well-structured, and strictly limit your responses to a maximum of 5 short paragraphs.'
            : 'You are a helpful assistant.';

        const apiMessages = [
            { role: 'system', content: systemPrompt },
            ...messages
        ];

        // 4. Request from Groq
        const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: model,
                messages: apiMessages,
                ...(responseLength === 'custom' && maxTokens ? { max_tokens: maxTokens } : {})
            })
        });

        const data = await groqRes.json();

        if (!groqRes.ok) {
            return NextResponse.json({ error: data.error?.message || 'Failed to fetch from Groq' }, { status: groqRes.status });
        }

        const replyContent = data.choices?.[0]?.message?.content || '';

        // 5. Save messages to DB if sessionId is provided
        if (sessionId) {
            try {
                // Ensure session is owned by user
                const session = await prisma.chatSession.findFirst({
                    where: { id: sessionId, userId }
                });

                if (session) {
                    const lastUserMessage = messages[messages.length - 1];

                    // Create User message
                    await prisma.chatMessage.create({
                        data: {
                            sessionId,
                            role: 'user',
                            content: encrypt(lastUserMessage.content)
                        }
                    });

                    // Create AI message
                    await prisma.chatMessage.create({
                        data: {
                            sessionId,
                            role: 'assistant',
                            content: encrypt(replyContent)
                        }
                    });

                    // Auto-generate title if this is the first message
                    if (session.title === 'New Chat' && lastUserMessage.content) {
                        const newTitle = lastUserMessage.content.slice(0, 30) + (lastUserMessage.content.length > 30 ? '...' : '');
                        await prisma.chatSession.update({
                            where: { id: sessionId },
                            data: { title: newTitle }
                        });
                    }
                }
            } catch (err) {
                console.error("Failed to save chat to DB:", err);
            }
        }

        // 6. Track Usage manually in DB
        const usage = data.usage;
        if (usage) {
            await prisma.groqCredential.update({
                where: { userId },
                data: {
                    promptTokens: { increment: usage.prompt_tokens || 0 },
                    completionTokens: { increment: usage.completion_tokens || 0 },
                    totalTokens: { increment: usage.total_tokens || 0 }
                }
            }).catch(e => console.error("Failed to update token usage:", e)); // Fire and forget fallback
        }

        return NextResponse.json(data);

    } catch (error) {
        console.error("POST /api/groq-intelligence/chat error:", error);
        return NextResponse.json({ error: 'Internal server error processing chat' }, { status: 500 });
    }
}
