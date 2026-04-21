import { NextResponse } from 'next/server';
import { trackApiHit } from '@/lib/monitoring';
import prisma from '@/lib/db';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

const MOEMAIL_API_BASE = 'https://moemail-api.danistimikwp.workers.dev';
const MOEMAIL_AUTH = 'Bearer moemail_zhen_2026';

export async function POST(req) {
    trackApiHit(req);
    try {
        // Generate email from MoeMail API
        const res = await fetch(`${MOEMAIL_API_BASE}/generate`, {
            method: 'POST',
            headers: {
                'Authorization': MOEMAIL_AUTH,
                'Content-Type': 'application/json'
            }
        });

        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`MoeMail API error: ${errorText}`);
        }

        const data = await res.json();
        console.log({ data });

        // Check if user is logged in via auth_token cookie
        const cookieStore = await cookies();
        const token = cookieStore.get('auth_token')?.value;
        
        // Save to database if user is logged in
        if (token) {
            try {
                const secret = new TextEncoder().encode(process.env.JWT_SECRET);
                const { payload } = await jwtVerify(token, secret);
                const userId = payload.sub;

                if (userId) {
                    await prisma.tempMailAccount.create({
                        data: {
                            id: data.id, // Use the UUID from MoeMail API
                            address: data.email,
                            password: '', // MoeMail doesn't use password
                            userId: userId
                        }
                    });
                    console.log('MoeMail account saved to database for user ID:', userId);
                }
            } catch (dbError) {
                console.error('Failed to save MoeMail to database:', dbError);
                // Don't fail the request if DB save fails
            }
        } else {
            // Even if not logged in, save to DB without userId
            try {
                await prisma.tempMailAccount.create({
                    data: {
                        id: data.id,
                        address: data.email,
                        password: '',
                        userId: null
                    }
                });
            } catch (dbError) {
                console.error('Failed to save MoeMail (no user) to database:', dbError);
            }
        }

        // Increment generated emails count (for both logged in and anonymous users)
        try {
            await prisma.tempMailStats.upsert({
                where: { id: 1 },
                update: { emailsGenerated: { increment: 1 } },
                create: { id: 1, emailsGenerated: 1 }
            });
        } catch (statsError) {
            console.error('Failed to update temp mail stats:', statsError);
        }

        // Standardize returning the provider so frontend knows
        return NextResponse.json({ ...data, provider: 'moemail' });
    } catch (error) {
        console.error('MoeMail Generate Error:', error);
        return NextResponse.json({ error: 'Failed to generate MoeMail' }, { status: 500 });
    }
}
