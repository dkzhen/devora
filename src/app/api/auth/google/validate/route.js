import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request) {
    try {
        const { clientId, clientSecret } = await request.json();

        if (!clientId || !clientSecret) {
            return NextResponse.json({ valid: false, message: 'Missing credentials' }, { status: 400 });
        }

        const params = new URLSearchParams({
            code: "test",
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uri: "http://localhost",
            grant_type: "authorization_code"
        });

        const res = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: params
        });

        const data = await res.json();


        if (data.error === "invalid_client") {
            return NextResponse.json({ valid: false, message: "Invalid Client ID or Secret" });
        }

        return NextResponse.json({ valid: true, message: "Credentials likely valid" });

    } catch (error) {
        console.error('Validation error:', error);
        return NextResponse.json({ valid: false, message: "Connection error" }, { status: 500 });
    }
}
