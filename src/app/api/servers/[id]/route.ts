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

// Cache token
let cachedToken: string | null = null;
let tokenExpiry = 0;

async function getCachedBeszelData() {
  const now = Date.now();
  
  if (!cachedToken || now > tokenExpiry) {
    cachedToken = await getBeszelToken();
    tokenExpiry = now + 5 * 60 * 1000;
  }
  
  return getBeszelSystems(cachedToken);
}

// Stale threshold: 2 minutes
const STALE_THRESHOLD_MS = 2 * 60 * 1000;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  try {
    const systems = await getCachedBeszelData();
    
    // Find the specific server
    const system = systems.find((s: BeszelSystem) => s.id === id);
    
    if (!system) {
      return NextResponse.json({ error: 'Server not found' }, { status: 404 });
    }
    
    const server = {
      id: system.id,
      name: system.name.toUpperCase().replace(' ', '-'),
      status: system.status === 'up' ? 'online' : 'offline',
      cpu: Math.round(system.info.cpu || 0),
      memory: Math.round(system.info.mp || 0),
      disk: Math.round(system.info.dp || 0),
      lastUpdated: new Date().toISOString(),
    };
    
    // Get historical metrics from database
    let history = { cpu: [] as number[], memory: [] as number[], disk: [] as number[] };
    let isStale = false;
    
    try {
      const metrics = await prisma.serverMetric.findMany({
        where: { serverId: id },
        orderBy: { createdAt: 'desc' },
        take: 60, // Last 60 samples (assuming 1 per minute = 1 hour)
      });
      
      if (metrics.length > 0) {
        // Reverse to get chronological order
        const reversed = [...metrics].reverse();
        history = {
          cpu: reversed.map(m => m.cpu),
          memory: reversed.map(m => m.memory),
          disk: reversed.map(m => m.disk),
        };
        
        // Check if data is stale
        const latestAge = Date.now() - metrics[metrics.length - 1].createdAt.getTime();
        isStale = latestAge > STALE_THRESHOLD_MS;
      }
    } catch (dbError) {
      console.error('Database error (table may not exist):', dbError);
      // Table might not exist yet, that's OK
    }
    
    return NextResponse.json({ server, history, isStale });
  } catch (error) {
    console.error('Error fetching server:', error);
    
    // Return mock data for the server
    const mockServers: Record<string, any> = {
      '1': { id: '1', name: 'UNRAID', status: 'online', cpu: 45, memory: 78, disk: 18 },
      '2': { id: '2', name: 'OPENCLAW', status: 'online', cpu: 22, memory: 35, disk: 8 },
      '3': { id: '3', name: 'OLLAMA', status: 'online', cpu: 62, memory: 48, disk: 55 },
      '4': { id: '4', name: 'COOLIFY', status: 'online', cpu: 5, memory: 33, disk: 20 },
    };
    
    const mockServer = mockServers[id];
    if (!mockServer) {
      return NextResponse.json({ error: 'Server not found' }, { status: 404 });
    }
    
    return NextResponse.json({ 
      server: mockServer, 
      history: { cpu: [], memory: [], disk: [] },
      isStale: true,
      usingFallback: true,
    });
  }
}
