// Cloudflare Turnstile verification helper
export async function verifyTurnstile(token) {
    if (!token) {
        return { success: false, error: 'Captcha token missing' };
    }

    try {
        const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                secret: process.env.TURNSTILE_SECRET_KEY,
                response: token,
            }),
        });

        const data = await response.json();
        
        if (data.success) {
            return { success: true };
        } else {
            return { success: false, error: 'Captcha verification failed' };
        }
    } catch (error) {
        console.error('Turnstile verification error:', error);
        return { success: false, error: 'Captcha verification error' };
    }
}
