import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import prisma from "@/lib/db";
import { SignJWT } from "jose";

const handler = NextAuth({
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_OAUTH_CLIENT_ID,
            clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
        }),
    ],
    pages: {
        signIn: '/login',
        error: '/login',
    },
    callbacks: {
        async signIn({ user, account, profile }) {
            try {
                // Check if user exists
                let existingUser = await prisma.user.findUnique({
                    where: { email: user.email }
                });

                if (!existingUser) {
                    // Create new user
                    existingUser = await prisma.user.create({
                        data: {
                            email: user.email,
                            name: user.name || profile.name,
                            password: null, // OAuth users don't have password
                            role: 'MEMBER'
                        }
                    });
                }

                // Store user ID in account for later use
                account.userId = existingUser.id;
                return true;
            } catch (error) {
                console.error('Sign in error:', error);
                return false;
            }
        },
        async jwt({ token, account, user }) {
            // Initial sign in
            if (account && user) {
                const dbUser = await prisma.user.findUnique({
                    where: { email: user.email }
                });
                
                if (dbUser) {
                    token.sub = dbUser.id;
                    token.email = dbUser.email;
                    token.name = dbUser.name;
                    token.role = dbUser.role;
                }
            }
            return token;
        },
        async session({ session, token }) {
            if (token) {
                session.user.id = token.sub;
                session.user.email = token.email;
                session.user.name = token.name;
                session.user.role = token.role;
            }
            return session;
        },
        async redirect({ url, baseUrl }) {
            // After successful OAuth, redirect to dashboard
            if (url.startsWith(baseUrl)) return url;
            if (url.startsWith('/')) return `${baseUrl}${url}`;
            return baseUrl + '/dashboard';
        }
    },
    events: {
        async signIn({ user, account, isNewUser }) {
            try {
                // Get user from DB
                const dbUser = await prisma.user.findUnique({
                    where: { email: user.email }
                });

                if (dbUser) {
                    // Generate JWT token for cookie
                    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
                    const token = await new SignJWT({
                        sub: dbUser.id,
                        email: dbUser.email,
                        name: dbUser.name,
                        role: dbUser.role
                    })
                        .setProtectedHeader({ alg: 'HS256' })
                        .setExpirationTime('24h')
                        .sign(secret);

                    // Note: We'll set this cookie in the client-side callback
                    // Store token temporarily in session
                    user.authToken = token;
                }
            } catch (error) {
                console.error('Sign in event error:', error);
            }
        }
    },
    session: {
        strategy: 'jwt',
        maxAge: 24 * 60 * 60, // 24 hours
    },
    secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };
