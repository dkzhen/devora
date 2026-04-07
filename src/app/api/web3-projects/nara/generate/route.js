import { NextResponse } from 'next/server';

const NARA_API_BASE = process.env.NARA_API_URL || 'http://localhost:5888';
const NARA_BEARER = process.env.NARA_BEARER || 'ws_zhen_9527';

export async function POST(request) {
    try {
        const apiRes = await fetch(`${NARA_API_BASE}/nara/generate`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${NARA_BEARER}`,
                'Content-Type': 'application/json'
            }
        });
        const apiData = await apiRes.json();
        
        if (!apiRes.ok || apiData.error) {
            return NextResponse.json({ success: false, error: apiData.error || 'Nara API failed', message: apiData.message });
        }
        
        return NextResponse.json({ success: true, data: apiData });
    } catch (error) {
        console.error('Failed to generate wallet:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
