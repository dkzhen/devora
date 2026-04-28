import { trackApiHit } from '@/lib/monitoring';
import { NextResponse } from 'next/server';
import { verifyApiKey, recordApiKeyUsage } from '@/lib/auth';
import prisma from '@/lib/db';

const API_BASE = 'https://api.mail.tm';
const MOEMAIL_API_BASE = 'https://moemail-api.danistimikwp.workers.dev';
const MOEMAIL_AUTH = 'Bearer moemail_zhen_2026';

function normalizeEmail(email = '') {
    return email.trim().toLowerCase();
}

function normalizeMoemailMessage(messageData, fallbackId) {
    return {
        ...messageData,
        id: messageData.id || fallbackId,
        html: messageData.html && typeof messageData.html === 'string' ? [messageData.html] : (messageData.html || null),
        text: messageData.text || '',
        from: {
            name: messageData.fromName || (messageData.from ? messageData.from.split('@')[0] : 'Unknown'),
            address: messageData.fromAddress || messageData.from || ''
        },
        subject: messageData.subject || '(No Subject)'
    };
}

async function findAccountForRequest({ accountId, email, userId }) {
    if (accountId) {
        return prisma.tempMailAccount.findFirst({
            where: { id: accountId, userId },
            select: { id: true, address: true, token: true }
        });
    }

    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail) return null;

    return prisma.tempMailAccount.findFirst({
        where: { address: normalizedEmail, userId },
        select: { id: true, address: true, token: true }
    });
}

async function syncMessagesToDatabase(messages, accountId, provider) {
    if (!messages.length) return;

    let newMessagesCount = 0;
    for (const msg of messages) {
        const exists = await prisma.tempMailMessage.findUnique({
            where: { id: msg.id },
            select: { id: true }
        });

        if (!exists) newMessagesCount++;

        await prisma.tempMailMessage.upsert({
            where: { id: msg.id },
            update: { seen: msg.seen || false },
            create: {
                id: msg.id,
                msgid: provider === 'moemail' ? msg.id : (msg.msgid || null),
                fromName: provider === 'moemail' ? (msg.fromName || (msg.from ? msg.from.split('@')[0] : null)) : (msg.from?.name || null),
                fromAddress: provider === 'moemail' ? (msg.fromAddress || msg.from || null) : (msg.from?.address || null),
                subject: msg.subject || null,
                intro: provider === 'moemail' ? (msg.body ? msg.body.substring(0, 100) : (msg.subject || 'Click to view message')) : (msg.intro || null),
                seen: msg.seen || false,
                createdAt: msg.createdAt ? new Date(msg.createdAt) : (msg.receivedAt ? new Date(msg.receivedAt) : new Date()),
                accountId
            }
        });
    }

    if (newMessagesCount > 0) {
        await prisma.tempMailStats.upsert({
            where: { id: 1 },
            update: { messagesReceived: { increment: newMessagesCount } },
            create: { id: 1, messagesReceived: newMessagesCount }
        });
    }
}

async function fetchMessageList({ account, provider }) {
    if (provider === 'moemail') {
        const res = await fetch(`${MOEMAIL_API_BASE}/inbox/${account.id}`, {
            headers: {
                'Authorization': MOEMAIL_AUTH,
                'Accept': 'application/json',
                'Accept-Encoding': 'identity'
            }
        });

        if (!res.ok) return { statusCode: res.status, messages: [] };

        const data = await res.json();
        const messages = Array.isArray(data) ? data : (data.messages || []);
        await syncMessagesToDatabase(messages, account.id, provider);
        return { statusCode: 200, messages };
    }

    if (!account.token) {
        return { statusCode: 401, messages: [], error: 'Account not found or no token' };
    }

    const res = await fetch(`${API_BASE}/messages?page=1`, {
        headers: {
            'Authorization': `Bearer ${account.token}`,
            'Accept': 'application/json',
            'Accept-Encoding': 'identity'
        }
    });

    if (!res.ok) return { statusCode: res.status, messages: [] };

    const data = await res.json();
    const messages = Array.isArray(data) ? data : (data['hydra:member'] || []);
    await syncMessagesToDatabase(messages, account.id, provider);
    return { statusCode: 200, messages };
}

async function fetchMessageDetail({ account, provider, messageId }) {
    if (provider === 'moemail') {
        const res = await fetch(`${MOEMAIL_API_BASE}/message/${messageId}`, {
            headers: {
                'Authorization': MOEMAIL_AUTH,
                'Accept': 'application/json',
                'Accept-Encoding': 'identity'
            }
        });

        if (!res.ok) return { statusCode: res.status, message: null };

        const messageData = await res.json();
        const message = normalizeMoemailMessage(messageData, messageId);
        return { statusCode: 200, message };
    }

    if (!account.token) {
        return { statusCode: 401, message: null, error: 'Account not found or no token' };
    }

    const res = await fetch(`${API_BASE}/messages/${messageId}`, {
        headers: {
            'Authorization': `Bearer ${account.token}`,
            'Accept': 'application/json',
            'Accept-Encoding': 'identity'
        }
    });

    if (!res.ok) return { statusCode: res.status, message: null };

    const message = await res.json();
    return { statusCode: 200, message };
}

export async function GET(req) {
    const auth = await verifyApiKey(req);
    if (!auth.success) {
        return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    trackApiHit(req);

    try {
        const { searchParams } = new URL(req.url);
        const accountId = searchParams.get('accountId');
        const email = searchParams.get('email');
        const messageId = searchParams.get('messageId') || searchParams.get('msgId');
        const provider = searchParams.get('provider') || 'mail.tm';

        if (!accountId && !email) {
            await recordApiKeyUsage(auth.apiKeyId, '/api/v1/temp-mail/messages', 'GET', 400);
            return NextResponse.json({ error: 'accountId or email required' }, { status: 400 });
        }

        const account = await findAccountForRequest({ accountId, email, userId: auth.user.id });
        if (!account) {
            await recordApiKeyUsage(auth.apiKeyId, '/api/v1/temp-mail/messages', 'GET', 404);
            return NextResponse.json({ error: 'Account not found for this API key user' }, { status: 404 });
        }

        if (messageId) {
            const { statusCode, message, error } = await fetchMessageDetail({ account, provider, messageId });
            await recordApiKeyUsage(auth.apiKeyId, '/api/v1/temp-mail/messages', 'GET', statusCode);
            if (statusCode !== 200) return NextResponse.json({ error: error || 'Failed to fetch message detail' }, { status: statusCode });
            return NextResponse.json({ success: true, account, message }, { status: 200 });
        }

        const { statusCode, messages, error } = await fetchMessageList({ account, provider });
        if (statusCode !== 200) {
            await recordApiKeyUsage(auth.apiKeyId, '/api/v1/temp-mail/messages', 'GET', statusCode);
            return NextResponse.json({ error: error || 'Failed to fetch messages' }, { status: statusCode });
        }

        await recordApiKeyUsage(auth.apiKeyId, '/api/v1/temp-mail/messages', 'GET', statusCode);
        return NextResponse.json({ 
            success: true,
            account,
            messages,
            count: messages.length 
        }, { status: statusCode });

    } catch (error) {
        console.error('v1 Messages API Error:', error);
        await recordApiKeyUsage(auth.apiKeyId, '/api/v1/temp-mail/messages', 'GET', 500);
        return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }
}

export async function POST(req) {
    const auth = await verifyApiKey(req);
    if (!auth.success) {
        return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    trackApiHit(req);

    try {
        const { accountId, email, provider = 'mail.tm', messageId, msgId } = await req.json().catch(() => ({}));
        const resolvedMessageId = messageId || msgId;

        if (!accountId && !email) {
            await recordApiKeyUsage(auth.apiKeyId, '/api/v1/temp-mail/messages', 'POST', 400);
            return NextResponse.json({ error: 'accountId or email required' }, { status: 400 });
        }

        const account = await findAccountForRequest({ accountId, email, userId: auth.user.id });
        if (!account) {
            await recordApiKeyUsage(auth.apiKeyId, '/api/v1/temp-mail/messages', 'POST', 404);
            return NextResponse.json({ error: 'Account not found for this API key user' }, { status: 404 });
        }

        if (resolvedMessageId) {
            const { statusCode, message, error } = await fetchMessageDetail({ account, provider, messageId: resolvedMessageId });
            await recordApiKeyUsage(auth.apiKeyId, '/api/v1/temp-mail/messages', 'POST', statusCode);
            if (statusCode !== 200) return NextResponse.json({ error: error || 'Failed to fetch message detail' }, { status: statusCode });
            return NextResponse.json({ success: true, account, message }, { status: 200 });
        }

        const { statusCode, messages, error } = await fetchMessageList({ account, provider });
        await recordApiKeyUsage(auth.apiKeyId, '/api/v1/temp-mail/messages', 'POST', statusCode);
        if (statusCode !== 200) return NextResponse.json({ error: error || 'Failed to fetch messages' }, { status: statusCode });

        return NextResponse.json({
            success: true,
            account,
            messages,
            count: messages.length
        }, { status: 200 });
    } catch (error) {
        console.error('v1 Messages POST API Error:', error);
        await recordApiKeyUsage(auth.apiKeyId, '/api/v1/temp-mail/messages', 'POST', 500);
        return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }
}
