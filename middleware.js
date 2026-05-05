import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const publicPaths = ['/', '/llm-console', '/register', '/airdrops', '/app-library', '/login', '/auth/google', '/maintenance', '/no-access', '/http-client', '/temp-mail', '/ai-providers', '/docs', '/web3-projects','/dashboard'];

// Role-restricted pages
const roleRestrictedPages = {
    'maintenance-control': 'ULTRA',
    // Add more restricted pages here as needed
    // 'admin-panel': 'ULTRA',
    // 'analytics': 'PRO',
};

// Note: Maintenance check moved to client-side or API routes
// Edge Runtime middleware cannot fetch internal APIs reliably
// Maintenance configs should be checked in page components instead

export async function middleware(request) {
    const { pathname } = request.nextUrl;

    // ✅ Skip API routes
    if (pathname.startsWith('/api')) {
        return NextResponse.next();
    }

    // ✅ Skip maintenance and no-access pages
    if (pathname === '/maintenance' || pathname === '/no-access') {
        return NextResponse.next();
    }

    // Get feature path early
    const featurePath = pathname.split('/')[1];

    // ✅ Check role-based access restrictions FIRST (before public paths check)
    if (featurePath && roleRestrictedPages[featurePath]) {
        const requiredRole = roleRestrictedPages[featurePath];
        const token = request.cookies.get('auth_token')?.value;
        
        if (!token) {
            // No token, redirect to no-access
            const noAccessUrl = new URL('/no-access', request.url);
            noAccessUrl.searchParams.set('feature', featurePath);
            noAccessUrl.searchParams.set('role', requiredRole);
            return NextResponse.redirect(noAccessUrl);
        }
        
        try {
            const secret = new TextEncoder().encode(process.env.JWT_SECRET);
            const { payload } = await jwtVerify(token, secret);
            
            // Get role from JWT payload
            const userRole = payload.role;
            
            // If role is undefined (old token) or doesn't match required role, redirect
            if (!userRole || userRole !== requiredRole) {
                const noAccessUrl = new URL('/no-access', request.url);
                noAccessUrl.searchParams.set('feature', featurePath);
                noAccessUrl.searchParams.set('role', requiredRole);
                return NextResponse.redirect(noAccessUrl);
            }
            
            // Role matches, allow access
        } catch (error) {
            // Token invalid, redirect to no-access
            const noAccessUrl = new URL('/no-access', request.url);
            noAccessUrl.searchParams.set('feature', featurePath);
            noAccessUrl.searchParams.set('role', requiredRole);
            return NextResponse.redirect(noAccessUrl);
        }
    }

    // ✅ Maintenance mode check removed from middleware
    // Maintenance checks should be done in page components or API routes
    // Edge Runtime cannot reliably fetch internal APIs

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