import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import prisma from '@/lib/db';
import { trackApiHit } from '@/lib/monitoring';

// GET: Fetch role-based rate limits
export async function GET(request) {
    trackApiHit(request);
    try {
        const auth = await verifyAuth(request);
        if (!auth.success) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        if (auth.user.role !== 'ULTRA') {
            return NextResponse.json({ error: 'ULTRA access required' }, { status: 403 });
        }

        // Fetch role limits from GlobalConfig
        const configs = await prisma.globalConfig.findMany({
            where: {
                key: {
                    in: [
                        'ROLE_RATE_LIMIT_MEMBER_RPM',
                        'ROLE_RATE_LIMIT_MEMBER_RPD',
                        'ROLE_RATE_LIMIT_MEMBER_MAX_TOKENS',
                        'ROLE_RATE_LIMIT_INSIDER_RPM',
                        'ROLE_RATE_LIMIT_INSIDER_RPD',
                        'ROLE_RATE_LIMIT_INSIDER_MAX_TOKENS',
                        'ROLE_RATE_LIMIT_PRO_RPM',
                        'ROLE_RATE_LIMIT_PRO_RPD',
                        'ROLE_RATE_LIMIT_PRO_MAX_TOKENS',
                        'ROLE_RATE_LIMIT_ULTRA_RPM',
                        'ROLE_RATE_LIMIT_ULTRA_RPD',
                        'ROLE_RATE_LIMIT_ULTRA_MAX_TOKENS',
                    ]
                }
            }
        });

        // Parse configs into structured format
        const roleLimits = {
            MEMBER: {
                rpm: 25,
                rpd: 1000,
                maxTokens: null,
            },
            INSIDER: {
                rpm: 50,
                rpd: 2000,
                maxTokens: null,
            },
            PRO: {
                rpm: 100,
                rpd: 5000,
                maxTokens: null,
            },
            ULTRA: {
                rpm: null, // unlimited
                rpd: null, // unlimited
                maxTokens: null, // unlimited
            },
        };

        configs.forEach(config => {
            const match = config.key.match(/ROLE_RATE_LIMIT_(\w+)_(RPM|RPD|MAX_TOKENS)/);
            if (match) {
                const [, role, type] = match;
                const key = type === 'RPM' ? 'rpm' : type === 'RPD' ? 'rpd' : 'maxTokens';
                const value = config.value === 'null' || config.value === '' ? null : parseInt(config.value, 10);
                if (roleLimits[role]) {
                    roleLimits[role][key] = value;
                }
            }
        });

        return NextResponse.json({ roleLimits });
    } catch (err) {
        console.error('GET /api/api-keys/role-limits error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST: Update role-based rate limits
export async function POST(request) {
    trackApiHit(request);
    try {
        const auth = await verifyAuth(request);
        if (!auth.success) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        if (auth.user.role !== 'ULTRA') {
            return NextResponse.json({ error: 'ULTRA access required' }, { status: 403 });
        }

        const { roleLimits } = await request.json();
        if (!roleLimits || typeof roleLimits !== 'object') {
            return NextResponse.json({ error: 'Invalid roleLimits data' }, { status: 400 });
        }

        // Validate and save each role's limits
        const validRoles = ['MEMBER', 'INSIDER', 'PRO', 'ULTRA'];
        const updates = [];

        for (const role of validRoles) {
            if (!roleLimits[role]) continue;

            const { rpm, rpd, maxTokens } = roleLimits[role];

            // Validate values
            if (rpm !== null && (isNaN(rpm) || rpm < 0)) {
                return NextResponse.json({ error: `Invalid RPM for ${role}` }, { status: 400 });
            }
            if (rpd !== null && (isNaN(rpd) || rpd < 0)) {
                return NextResponse.json({ error: `Invalid RPD for ${role}` }, { status: 400 });
            }
            if (maxTokens !== null && (isNaN(maxTokens) || maxTokens < 0)) {
                return NextResponse.json({ error: `Invalid Max Tokens for ${role}` }, { status: 400 });
            }

            // Prepare upsert operations
            updates.push(
                prisma.globalConfig.upsert({
                    where: { key: `ROLE_RATE_LIMIT_${role}_RPM` },
                    create: {
                        key: `ROLE_RATE_LIMIT_${role}_RPM`,
                        value: rpm === null ? 'null' : rpm.toString(),
                        description: `Rate limit RPM for ${role} role`,
                    },
                    update: {
                        value: rpm === null ? 'null' : rpm.toString(),
                    },
                }),
                prisma.globalConfig.upsert({
                    where: { key: `ROLE_RATE_LIMIT_${role}_RPD` },
                    create: {
                        key: `ROLE_RATE_LIMIT_${role}_RPD`,
                        value: rpd === null ? 'null' : rpd.toString(),
                        description: `Rate limit RPD for ${role} role`,
                    },
                    update: {
                        value: rpd === null ? 'null' : rpd.toString(),
                    },
                }),
                prisma.globalConfig.upsert({
                    where: { key: `ROLE_RATE_LIMIT_${role}_MAX_TOKENS` },
                    create: {
                        key: `ROLE_RATE_LIMIT_${role}_MAX_TOKENS`,
                        value: maxTokens === null ? 'null' : maxTokens.toString(),
                        description: `Rate limit Max Tokens for ${role} role`,
                    },
                    update: {
                        value: maxTokens === null ? 'null' : maxTokens.toString(),
                    },
                })
            );
        }

        await prisma.$transaction(updates);

        return NextResponse.json({ success: true, message: 'Role limits updated successfully' });
    } catch (err) {
        console.error('POST /api/api-keys/role-limits error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
