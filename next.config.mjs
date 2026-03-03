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

};

export default nextConfig;
