import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const publicPaths = ['/', '/register', '/airdrops', '/app-library', '/login', '/auth/google', '/maintenance'];

export async function middleware(request) {
    const { pathname } = request.nextUrl;

    // ✅ Skip API routes
    if (pathname.startsWith('/api')) {
        return NextResponse.next();
    }

    // ✅ Allow public pages
    if (
        publicPaths.includes(pathname) ||
        publicPaths.some(path => pathname.startsWith(path + '/'))
    ) {
        return NextResponse.next();
    }

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
    matcher: [
        '/((?!_next|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|css|js|map)).*)',
    ],
};