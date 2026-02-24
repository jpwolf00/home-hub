import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Beszel configuration
const BESZEL_URL = process.env.BESZEL_URL || 'http://192.168.85.199:8090';
const BESZEL_USER = process.env.BESZEL_USER || 'jpwolf00@gmail.com';
const BESZEL_PASS = process.env.BESZEL_PASS || '$nowcat1974';

interface BeszelSystem {
  id: string;
  name: string;
  status: string;
  host: string;
  info: {
    cpu: number;
    mp: number;
    dp: number;
    la?: number[];
    ct?: number;
  };
}

async function getBeszelToken(): Promise<string> {
  const res = await fetch(`${BESZEL_URL}/api/collections/users/auth-with-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identity: BESZEL_USER, password: BESZEL_PASS }),
  });
  
  if (!res.ok) throw new Error('Failed to authenticate with Beszel');
  const data = await res.json();
  return data.token;
}

async function getBeszelSystems(token: string): Promise<BeszelSystem[]> {
  const res = await fetch(`${BESZEL_URL}/api/collections/systems/records`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  
  if (!res.ok) throw new Error('Failed to fetch systems from Beszel');
  const data = await res.json();
  return data.items || [];
}

// Cache token and systems for reuse
let cachedToken: string | null = null;
let tokenExpiry = 0;

async function getCachedBeszelData() {
  const now = Date.now();
  
  if (!cachedToken || now > tokenExpiry) {
    cachedToken = await getBeszelToken();
    tokenExpiry = now + 5 * 60 * 1000; // 5 minutes
  }
  
  return getBeszelSystems(cachedToken);
}

// Stale data threshold: 2 minutes
const STALE_THRESHOLD_MS = 2 * 60 * 1000;

export async function GET() {
  try {
    const systems = await getCachedBeszelData();
    
    // Transform Beszel data to our format
    const servers = systems.map((sys: BeszelSystem) => ({
      id: sys.id,
      name: sys.name.toUpperCase().replace(' ', '-'),
      status: sys.status === 'up' ? 'online' : 'offline',
      cpu: Math.round(sys.info.cpu || 0),
      memory: Math.round(sys.info.mp || 0),
      disk: Math.round(sys.info.dp || 0),
    }));

    // Check if data is stale by trying to get the latest saved metrics
    let isStale = false;
    try {
      const latestMetrics = await prisma.serverMetric.findFirst({
        orderBy: { createdAt: 'desc' },
      });
      
      if (latestMetrics) {
        const age = Date.now() - latestMetrics.createdAt.getTime();
        isStale = age > STALE_THRESHOLD_MS;
      }
    } catch {
      // If table doesn't exist or other error, don't mark as stale
      isStale = false;
    }
    
    return NextResponse.json({ servers, isStale, lastUpdated: new Date().toISOString() });
  } catch (error) {
    console.error('Beszel API error:', error);
    
    // Return mock data on error
    return NextResponse.json({
      servers: [
        { id: '1', name: 'UNRAID', status: 'online', cpu: 45, memory: 78, disk: 18 },
        { id: '2', name: 'OPENCLAW', status: 'online', cpu: 22, memory: 35, disk: 8 },
        { id: '3', name: 'OLLAMA', status: 'online', cpu: 62, memory: 48, disk: 55 },
        { id: '4', name: 'COOLIFY', status: 'online', cpu: 5, memory: 33, disk: 20 },
      ],
      isStale: true, // Mark as stale since we're using fallback data
      usingFallback: true,
    });
  }
}
