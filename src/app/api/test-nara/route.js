import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json({ success: true, message: 'Nara API test successful' });
}
