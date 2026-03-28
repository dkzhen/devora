import UpgradeClientForm from '@/components/UpgradeClientForm';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { jwtVerify } from 'jose';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function UpgradePage() {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
        redirect('/login');
    }

    try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);

        const user = await prisma.user.findUnique({
            where: { id: payload.sub }
        });

        if (!user) {
            redirect('/login');
        }

        // If user is already upgraded, redirect to settings
        if (user.role === 'PRO' || user.role === 'ULTRA') {
            redirect('/settings');
        }

        return (
            <UpgradeClientForm
                callbackUrlDev={process.env.CALLBACK_URL_DEV}
                callbackUrlProd={process.env.CALLBACK_URL_PROD}
            />
        );
    } catch (error) {
        redirect('/login');
    }
}
