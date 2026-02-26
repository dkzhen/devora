import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

// Paths that do not require authentication
const publicPaths = ['/login', '/auth/google', '/api/auth/login', '/api/auth/google'];

export async function middleware(request) {
    const { pathname } = request.nextUrl;

    // 1. Check if public path
    if (publicPaths.some(path => pathname.startsWith(path))) {
        return NextResponse.next();
    }

    // 2. Check for Token in Cookies
    const token = request.cookies.get('auth_token')?.value;

    if (!token) {
        // Redirect to login if no token
        const loginUrl = new URL('/login', request.url);
        // Optional: Add `callbackUrl` to redirect back after login
        return NextResponse.redirect(loginUrl);
    }

    try {
        // 3. Verify Token
        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        await jwtVerify(token, secret);

        // Token valid, proceed
        return NextResponse.next();
    } catch (error) {
        // Token invalid/expired, redirect to login
        const loginUrl = new URL('/login', request.url);
        return NextResponse.redirect(loginUrl);
    }
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder resources (if any)
         */
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};
