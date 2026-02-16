import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST - Save metrics for all servers
// This endpoint should be called every minute by a cron job
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { servers } = body;
    
    if (!servers || !Array.isArray(servers)) {
      return NextResponse.json({ error: 'Invalid request: servers array required' }, { status: 400 });
    }
    
    // Save each server's metrics
    const results = await Promise.allSettled(
      servers.map(async (server: { id: string; cpu: number; memory: number; disk: number }) => {
        try {
          const metric = await prisma.serverMetric.create({
            data: {
              serverId: server.id,
              cpu: server.cpu,
              memory: server.memory,
              disk: server.disk,
            },
          });
          return { serverId: server.id, success: true, id: metric.id };
        } catch (error) {
          console.error(`Failed to save metrics for server ${server.id}:`, error);
          return { serverId: server.id, success: false, error: String(error) };
        }
      })
    );
    
    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failed = results.length - successful;
    
    return NextResponse.json({
      success: true,
      saved: successful,
      failed,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error saving metrics:', error);
    return NextResponse.json({ error: 'Failed to save metrics' }, { status: 500 });
  }
}

// GET - Retrieve metrics history for a server (optional helper)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const serverId = searchParams.get('serverId');
  const limit = parseInt(searchParams.get('limit') || '60');
  
  if (!serverId) {
    return NextResponse.json({ error: 'serverId is required' }, { status: 400 });
  }
  
  try {
    const metrics = await prisma.serverMetric.findMany({
      where: { serverId },
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 1440), // Max 24 hours at 1/min
    });
    
    return NextResponse.json({
      serverId,
      count: metrics.length,
      metrics: metrics.reverse(), // Chronological order
    });
  } catch (error) {
    console.error('Error fetching metrics:', error);
    return NextResponse.json({ error: 'Failed to fetch metrics' }, { status: 500 });
  }
}
