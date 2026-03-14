import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import prisma from '@/lib/db';

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;
const BASE_URL = process.env.NODE_ENV === 'production'
    ? process.env.BASE_URL_PROD
    : process.env.BASE_URL_DEV;

/**
 * Get user ID from session
 */
const getUserId = async () => {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('auth_token')?.value;
        if (!token) return null;

        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);
        return payload.sub;
    } catch {
        return null;
    }
};

/**
 * Generate Telegram caption using Groq AI (HTML parse mode)
 */
async function generateCaption(airdrop, tasks, userId) {
    // Telegram strips <a> tags with localhost URLs, so we force the prod URL for the post
    const publicBaseUrl = process.env.BASE_URL_PROD || 'https://devora.dkzhen.org';
    const detailUrl = `${publicBaseUrl}/airdrops/${airdrop.id}`;

    let linksStr = '';
    try {
        const links = typeof airdrop.links === 'string' ? JSON.parse(airdrop.links) : (airdrop.links || []);
        if (links.length > 0) {
            linksStr = links.map(l => `${l.name}: ${l.url}`).join('\n');
        }
    } catch (e) {
        linksStr = '';
    }

    const taskSummary = tasks.slice(0, 10).map((t, i) => {
        let stepsInfo = '';
        if (t.steps && Array.isArray(t.steps)) {
            const publicSteps = t.steps.filter(s => s.isPrivate !== true);
            if (publicSteps.length > 0) {
                stepsInfo = '\n  Steps:\n' + publicSteps.map((s, idx) => `  - ${s.text} ${s.link ? '(Link: ' + s.link + ')' : ''}`).join('\n');
            }
        }
        return `Task ${i + 1}: ${t.title} (${t.category}) — Status: ${t.status}${t.deadline ? ` | Until: ${new Date(t.deadline).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}` : ''}${stepsInfo}`;
    }).join('\n\n');

    const isUpdate = tasks.length === 1;

    const prompt = `You are a crypto airdrop content writer for a Telegram channel.
Create an attractive, informative Telegram post using Telegram HTML formatting.

${isUpdate
    ? `This is an UPDATE for an existing project. Focus on the NEW TASK details. Do not repeat too much project background.`
    : `This is a NEW project introduction. Provide a full overview.`}

Project Data:
- Name: ${airdrop.name}
- Symbol: ${airdrop.symbol || 'N/A'}
- Type: ${airdrop.projectType || 'Project'}
- Status: ${airdrop.status || 'N/A'}
- Reward Type: ${airdrop.rewardType || 'Airdrop'}
- Reward Date: ${airdrop.rewardDate || 'TBA'}
- Total Raised: ${airdrop.raise || 'N/A'}
- Description: ${airdrop.description || 'N/A'}
- Official Links:
${linksStr || 'N/A'}

Tasks Information:
${taskSummary || 'No tasks yet'}

Detail Page: ${detailUrl}

Requirements:
1. Use Telegram HTML formatting ONLY: <b>bold</b>, <i>italic</i>, <code>code</code>, <a href="url">text</a>
2. ${isUpdate
    ? `Start with an "Update" header emoji (e.g. 🔄 or 📢) and the project name. Mention that a NEW TASK is available.`
    : `Start with an eye-catching header emoji and bold project name, followed by a short, informative sentence about what this project is.`}
3. ${isUpdate
    ? `Briefly list project type and status. Focus most of the post on the Step-by-Step guide for the task(s) provided.`
    : `Include project type, status, raised amount, and reward date in a neat list.`}
4. Provide a clear, step-by-step guide based on the tasks and their specific steps. Format them clearly (e.g. "Step 1", "Step 2"). Include links within the text using <a href="url">Link Text</a> when appropriate.
5. End with a clear call-to-action: <a href="${detailUrl}">📋 View Full Details</a>
6. STRICT RULE: DO NOT include any hashtags (#) anywhere in the post.
7. Keep it informative but well-structured with clear line breaks so it's easy to read on mobile.
8. Do NOT use &amp; &lt; &gt; escape sequences in your output — use raw & < > only in HTML tags
9. Do NOT wrap output in code blocks or XML — just return the raw HTML text
10. Telegram only supports these HTML tags: <b>, <i>, <u>, <s>, <code>, <pre>, <a href="...">`;

    const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${GROQ_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
                { role: 'system', content: 'You are an expert crypto Telegram content writer. Output valid Telegram HTML text only. Never use MarkdownV2 syntax.' },
                { role: 'user', content: prompt }
            ],
            temperature: 0.7,
            max_tokens: 1024,
        })
    });

    if (!resp.ok) {
        const err = await resp.text();
        throw new Error(`Groq API error: ${err}`);
    }

    const data = await resp.json();
    let caption = data.choices?.[0]?.message?.content?.trim() || '';

    // Strip any markdown code block wrappers if AI accidentally added them
    caption = caption.replace(/^```html?\n?/i, '').replace(/\n?```$/i, '').trim();

    // Track Usage
    const usage = data.usage;
    if (usage && userId) {
        await prisma.groqCredential.update({
            where: { userId },
            data: {
                promptTokens: { increment: usage.prompt_tokens || 0 },
                completionTokens: { increment: usage.completion_tokens || 0 },
                totalTokens: { increment: usage.total_tokens || 0 }
            }
        }).catch(e => console.error("[telegram-post] Failed to update token usage:", e));
    }

    return caption;
}

/**
 * Fetch channel info from Telegram
 */
async function getTelegramChannelInfo() {
    const telegramBase = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;
    try {
        const res = await fetch(`${telegramBase}/getChat?chat_id=${CHANNEL_ID}`);
        if (!res.ok) return null;
        const data = await res.json();
        if (!data.ok || !data.result) return null;

        const info = { title: data.result.title || 'Your Channel', photoUrl: null };

        // If channel has a photo, get the actual file URL
        if (data.result.photo?.small_file_id) {
            const fileRes = await fetch(`${telegramBase}/getFile?file_id=${data.result.photo.small_file_id}`);
            if (fileRes.ok) {
                const fileData = await fileRes.json();
                if (fileData.ok && fileData.result?.file_path) {
                    info.photoUrl = `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${fileData.result.file_path}`;
                }
            }
        }
        return info;
    } catch (e) {
        console.error('[telegram-post] getChat error:', e);
        return null;
    }
}

/**
 * Send message to Telegram
 */
async function sendToTelegram(caption, imageUrl) {
    const telegramBase = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

    const sendMsg = async (endpoint, body) => {
        const res = await fetch(`${telegramBase}/${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        return res.json();
    };

    if (imageUrl) {
        // Try sendPhoto first
        const photoResult = await sendMsg('sendPhoto', {
            chat_id: CHANNEL_ID,
            photo: imageUrl,
            caption: caption,
            parse_mode: 'HTML',
        });

        if (photoResult.ok) return photoResult;

        // Fallback: sendPhoto failed (bad URL/format) → try sendMessage with HTML
        console.warn('[telegram-post] sendPhoto failed, falling back to sendMessage:', photoResult.description);
    }

    // Send as text message
    return sendMsg('sendMessage', {
        chat_id: CHANNEL_ID,
        text: caption,
        parse_mode: 'HTML',
    });
}

/**
 * POST handler
 * action: "preview" → return caption from Groq (no Telegram call)
 * action: "post"    → send to Telegram channel
 */
export async function POST(request) {
    try {
        const body = await request.json();
        const { airdrop, tasks = [], action = 'preview', caption: providedCaption, imageUrl: providedImageUrl } = body;

        if (!airdrop) {
            return NextResponse.json({ error: 'Missing airdrop data' }, { status: 400 });
        }

        const imageUrl = providedImageUrl !== undefined ? providedImageUrl : (airdrop.icon || null);

        if (action === 'preview') {
            const userId = await getUserId();
            const [caption, channelInfo] = await Promise.all([
                generateCaption(airdrop, tasks, userId),
                getTelegramChannelInfo()
            ]);

            return NextResponse.json({
                caption,
                imageUrl,
                detailUrl: `${BASE_URL}/airdrops/${airdrop.id}`,
                channelInfo: channelInfo || { title: 'Your Channel', photoUrl: null }
            });
        }

        if (action === 'post') {
            const caption = providedCaption;
            if (!caption) {
                return NextResponse.json({ error: 'Missing caption for post action' }, { status: 400 });
            }

            const telegramData = await sendToTelegram(caption, imageUrl);

            if (!telegramData.ok) {
                return NextResponse.json({
                    error: 'Telegram API error',
                    details: telegramData.description
                }, { status: 500 });
            }

            return NextResponse.json({ ok: true, messageId: telegramData.result?.message_id });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

    } catch (error) {
        console.error('[telegram-post]', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}
