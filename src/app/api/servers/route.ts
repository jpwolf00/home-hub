import { NextResponse } from 'next/server';

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
    mp: number;  // memory percent
    dp: number;  // disk percent
    la?: number[];  // load average
    ct?: number;   // containers
  };
}

async function getBeszelToken(): Promise<string> {
  const res = await fetch(`${BESZEL_URL}/api/collections/users/auth-with-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identity: BESZEL_USER, password: BESZEL_PASS }),
  });
  
  if (!res.ok) {
    throw new Error('Failed to authenticate with Beszel');
  }
  
  const data = await res.json();
  return data.token;
}

async function getBeszelSystems(token: string): Promise<BeszelSystem[]> {
  const res = await fetch(`${BESZEL_URL}/api/collections/systems/records`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  
  if (!res.ok) {
    throw new Error('Failed to fetch systems from Beszel');
  }
  
  const data = await res.json();
  return data.items || [];
}

export async function GET() {
  try {
    const token = await getBeszelToken();
    const systems = await getBeszelSystems(token);
    
    // Transform Beszel data to our format
    const servers = systems.map((sys: BeszelSystem) => ({
      id: sys.id,
      name: sys.name.toUpperCase().replace(' ', '-'),
      status: sys.status === 'up' ? 'online' : 'offline',
      cpu: Math.round(sys.info.cpu || 0),
      memory: Math.round(sys.info.mp || 0),
      disk: Math.round(sys.info.dp || 0),
    }));
    
    return NextResponse.json({ servers });
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
    });
  }
}
