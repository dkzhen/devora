/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '**', // Allow SEMUA hostname dari https
            },
            {
                protocol: 'http',
                hostname: '**', // Allow SEMUA hostname dari http
            },
        ],
    },
    serverExternalPackages: ['jose', 'bcrypt'], // Added for Prisma/crypto stability if needed later
    experimental: {
        serverActions: {
            bodySizeLimit: '500mb',
        },
        proxyClientMaxBodySize: '500mb', // Bypasses middleware 10mb limit
    },
};

export default nextConfig;
