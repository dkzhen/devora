import prisma from '@/lib/db';

/**
 * Tracks an API hit for the given Next.js request.
 * Normalizes the path by stripping search parameters and dynamic IDs
 * to provide a clean endpoint path for statistics.
 * 
 * @param {Request} request 
 * @param {string} [customPath] Optional override for dynamic routes to group them correctly
 */
export async function trackApiHit(request, customPath = null) {
    try {
        const method = request.method;
        const url = new URL(request.url);

        // Normalize path if no custom path is provided
        let path = customPath || url.pathname;

        // Basic normalization for UUIDs or Mongo ObjectIDs in the path
        if (!customPath) {
            path = path.replace(/\/[a-f0-9A-F]{8}-[a-f0-9A-F]{4}-[a-f0-9A-F]{4}-[a-f0-9A-F]{4}-[a-f0-9A-F]{12}/g, '/:id');
            // Basic normalization for emails in path
            path = path.replace(/\/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/g, '/:email');
        }

        const uniqueKey = `${method} ${path}`;

        // Fire and forget, don't await blocking the main request
        prisma.apiEndpointStats.upsert({
            where: { path: uniqueKey },
            update: {
                hitCount: { increment: 1 },
                lastHit: new Date()
            },
            create: {
                method,
                path: uniqueKey,
                hitCount: 1,
                lastHit: new Date()
            }
        }).catch(err => console.error('Error tracking API hit:', err.message));

    } catch (error) {
        console.error('Failed to parse API hit:', error.message);
    }
}
