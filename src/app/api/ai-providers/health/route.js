import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET() {
    try {
        // Get API usage stats from last 1 hour
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        
        const recentUsage = await prisma.apiKeyUsage.findMany({
            where: {
                createdAt: {
                    gte: oneHourAgo
                },
                endpoint: '/api/v1/ai/chat/completions'
            },
            select: {
                status: true
            }
        });

        if (recentUsage.length === 0) {
            return NextResponse.json({
                status: 'idle',
                color: 'gray',
                totalRequests: 0,
                successRate: 0,
                errorRate: 0
            });
        }

        const totalRequests = recentUsage.length;
        const successRequests = recentUsage.filter(u => u.status >= 200 && u.status < 400).length;
        const errorRequests = recentUsage.filter(u => u.status >= 400).length;
        
        const successRate = (successRequests / totalRequests) * 100;
        const errorRate = (errorRequests / totalRequests) * 100;

        // Determine status and color based on error rate
        let status, color;
        
        if (errorRate === 0) {
            status = 'healthy';
            color = 'emerald'; // Full green
        } else if (errorRate < 10) {
            status = 'good';
            color = 'green'; // Light green
        } else if (errorRate < 25) {
            status = 'degraded';
            color = 'yellow'; // Yellow
        } else if (errorRate < 50) {
            status = 'warning';
            color = 'orange'; // Orange
        } else {
            status = 'critical';
            color = 'red'; // Red
        }

        return NextResponse.json({
            status,
            color,
            totalRequests,
            successRate: Math.round(successRate * 10) / 10,
            errorRate: Math.round(errorRate * 10) / 10,
            successRequests,
            errorRequests
        });
    } catch (error) {
        console.error('Health Check Error:', error);
        return NextResponse.json({
            status: 'unknown',
            color: 'gray',
            totalRequests: 0,
            successRate: 0,
            errorRate: 0
        }, { status: 500 });
    }
}
