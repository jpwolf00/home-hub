import { NextRequest } from 'next/server';

// Define the server data type
interface ServerData {
  id: string;
  name: string;
  status: 'online' | 'offline';
  cpu: number;
  memory: number;
  disk: number;
}

// Mock data for development
const mockServers: ServerData[] = [
  {
    id: '1',
    name: 'UNRAID',
    status: 'online',
    cpu: 45,
    memory: 78,
    disk: 18,
  },
  {
    id: '2',
    name: 'OPENCLAW',
    status: 'online',
    cpu: 22,
    memory: 35,
    disk: 8,
  },
  {
    id: '3',
    name: 'OLLAMA',
    status: 'online',
    cpu: 62,
    memory: 48,
    disk: 55,
  },
  {
    id: '4',
    name: 'MEDIA-SERVER',
    status: 'offline',
    cpu: 0,
    memory: 0,
    disk: 0,
  },
];

export async function GET(request: NextRequest) {
  try {
    // In production, we would fetch from the Beszel API
    // For now, we're using mock data
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return new Response(
      JSON.stringify({
        servers: mockServers,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error fetching server data:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch server data' }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}