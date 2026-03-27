import prisma from '@/lib/db';
import { NextResponse } from 'next/server';
import { checkGmail, sendEmail } from '@/lib/services/gmail.service';

export const dynamic = 'force-dynamic';

export async function POST(request) {
    try {
        const url = new URL(request.url);
        const forceEmail = url.searchParams.get('forceEmail'); // For debugging/testing bypassing timer

        const whereClause = {
            autoActivityEnabled: true
        };

        if (forceEmail) {
            whereClause.email = forceEmail;
        } else {
            whereClause.nextAutoActivityAt = {
                lte: new Date()
            };
        }

        // Find due accounts
        const dueAccounts = await prisma.account.findMany({
            where: whereClause,
            include: {
                user: true
            }
        });

        if (dueAccounts.length === 0) {
            return NextResponse.json({ success: true, message: "No accounts due for activity", executed: 0 });
        }

        const { decrypt } = await import('@/lib/crypto');
        const results = [];

        for (const account of dueAccounts) {
            const user = account.user;
            let clientId, clientSecret;
            
            try {
                if (user.googleClientId && user.googleClientSecret) {
                    clientId = user.googleClientId.includes(':') ? decrypt(user.googleClientId) : user.googleClientId;
                    clientSecret = user.googleClientSecret.includes(':') ? decrypt(user.googleClientSecret) : user.googleClientSecret;
                }
            } catch (e) {
                console.warn(`Credential decryption failed for user ${user.id}`);
                continue; 
            }

            if (!clientId || !clientSecret || !account.refreshToken) {
                results.push({ email: account.email, success: false, error: 'Missing credentials' });
                continue;
            }

            // 1. Perform a read
            const checkResult = await checkGmail(account.refreshToken, clientId, clientSecret);
            let sendResult = { success: false, skip: true };

            // 2. Perform a send if target exists
            if (account.autoActivityTarget) {
                const subject = `Automated Activity Ping: ${account.email}`;
                const text = `Hello,\n\nThis is an automated activity ping to keep this account active.\nTimestamp: ${new Date().toISOString()}\n\nService: Gmail Center Bot`;
                sendResult = await sendEmail(account.refreshToken, clientId, clientSecret, account.autoActivityTarget, subject, text);
            }

            // 3. Update schedule (random 1-7 days)
            const daysToAdd = Math.floor(Math.random() * 7) + 1;
            const nextDate = new Date();
            nextDate.setDate(nextDate.getDate() + daysToAdd);

            await prisma.account.update({
                where: { email: account.email },
                data: {
                    lastAutoActivityAt: new Date(),
                    nextAutoActivityAt: nextDate,
                    totalMessages: checkResult.success ? checkResult.totalMessages : account.totalMessages,
                    totalThreads: checkResult.success ? checkResult.totalThreads : account.totalThreads,
                    lastCheck: new Date()
                }
            });

            results.push({
                email: account.email,
                readSuccess: checkResult.success,
                sendSuccess: sendResult.success,
                nextActivityScheduled: nextDate
            });
        }

        return NextResponse.json({ success: true, executed: dueAccounts.length, results });

    } catch (error) {
        console.error('Cron API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
