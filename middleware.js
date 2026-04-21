import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const publicPaths = ['/', '/llm-console', '/register', '/airdrops', '/app-library', '/login', '/auth/google', '/maintenance', '/no-access', '/http-client', '/temp-mail', '/ai-providers', '/docs', '/web3-projects'];

// Role-restricted pages
const roleRestrictedPages = {
    'maintenance-control': 'ULTRA',
    // Add more restricted pages here as needed
    // 'admin-panel': 'ULTRA',
    // 'analytics': 'PRO',
};

// Cache for maintenance configs (1 minute TTL)
let maintenanceCache = { data: null, timestamp: 0 };
const CACHE_TTL = 60000; // 1 minute

async function getMaintenanceConfigs() {
    const now = Date.now();
    
    // Return cached data if still valid
    if (maintenanceCache.data && (now - maintenanceCache.timestamp) < CACHE_TTL) {
        return maintenanceCache.data;
    }

    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/maintenance`, {
            cache: 'no-store',
        });
        
        if (response.ok) {
            const configs = await response.json();
            maintenanceCache = { data: configs, timestamp: now };
            return configs;
        }
    } catch (error) {
        console.error('Failed to fetch maintenance configs:', error);
    }
    
    return maintenanceCache.data || [];
}

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

    // ✅ Check maintenance mode for feature pages
    if (featurePath) {
        const maintenanceConfigs = await getMaintenanceConfigs();
        const config = maintenanceConfigs.find(c => c.feature === featurePath);
        
        if (config && config.enabled) {
            // Check if user is ULTRA admin (they can bypass maintenance)
            const token = request.cookies.get('auth_token')?.value;
            let isUltra = false;
            
            if (token) {
                try {
                    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
                    const { payload } = await jwtVerify(token, secret);
                    
                    // Fetch user role (you might want to include this in JWT payload for better performance)
                    const userResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/auth/me`, {
                        headers: { Cookie: `auth_token=${token}` },
                        cache: 'no-store',
                    });
                    
                    if (userResponse.ok) {
                        const userData = await userResponse.json();
                        isUltra = userData.user?.role === 'ULTRA';
                    }
                } catch (error) {
                    // Token invalid or expired
                }
            }
            
            // Redirect to maintenance page if not ULTRA admin
            if (!isUltra) {
                const maintenanceUrl = new URL('/maintenance', request.url);
                maintenanceUrl.searchParams.set('feature', config.feature);
                maintenanceUrl.searchParams.set('message', encodeURIComponent(config.message || 'This feature is currently under maintenance.'));
                return NextResponse.redirect(maintenanceUrl);
            }
        }
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