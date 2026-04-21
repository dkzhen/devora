import { NextResponse } from 'next/server';
import { trackApiHit } from '@/lib/monitoring';

const MOEMAIL_API_BASE = 'https://moemail-api.danistimikwp.workers.dev';
const MOEMAIL_AUTH = 'Bearer moemail_zhen_2026';

export async function GET(req, { params }) {
    trackApiHit(req);
    try {
        const { id } = await params;
        
        if (!id) {
            return NextResponse.json({ error: 'ID required' }, { status: 400 });
        }

        const res = await fetch(`${MOEMAIL_API_BASE}/code/${id}`, {
            headers: {
                'Authorization': MOEMAIL_AUTH,
                'Accept': 'application/json'
            }
        });

        if (!res.ok) {
            const errorText = await res.text();
            // If the email simply hasn't received anything yet, MoeMail returns "No messages found"
            if (errorText.includes('No messages found') || res.status === 404) {
                return NextResponse.json({ code: null });
            }
            throw new Error(`MoeMail API error: ${errorText}`);
        }

        const data = await res.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('MoeMail Code/OTP Error:', error);
        return NextResponse.json({ error: 'Failed to extract OTP from MoeMail' }, { status: 500 });
    }
}
