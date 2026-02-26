import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

// Paths that do not require authentication
const publicPaths = [
    '/',
    '/register',
    '/airdrops',
    '/login',
    '/auth/google',
    '/api/auth/login',
    '/api/auth/google'
];

export async function middleware(request) {
    const { pathname } = request.nextUrl;

    // 1. Allow public routes
    const isPublic =
        publicPaths.includes(pathname) ||
        publicPaths.some(path => pathname.startsWith(path + '/'));

    if (isPublic) {
        return NextResponse.next();
    }

    // 2. Check Token
    const token = request.cookies.get('auth_token')?.value;

    if (!token) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        await jwtVerify(token, secret);
        return NextResponse.next();
    } catch (error) {
        return NextResponse.redirect(new URL('/login', request.url));
    }
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};