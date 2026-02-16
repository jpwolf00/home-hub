import { NextRequest, NextResponse } from 'next/server';
import { createFeature, readFeatures } from '@/lib/kanban-store';

export async function GET() {
  try {
    const features = await readFeatures();
    const grouped = {
      planned: features.filter(f => f.status === 'planned'),
      in_progress: features.filter(f => f.status === 'in_progress'),
      completed: features.filter(f => f.status === 'completed'),
      on_hold: features.filter(f => f.status === 'on_hold'),
    };
    return NextResponse.json(grouped);
  } catch (error) {
    console.error('Error reading kanban:', error);
    return NextResponse.json({ error: 'Failed to read kanban' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description } = body;
    if (!title) {
      return NextResponse.json({ error: 'Title required' }, { status: 400 });
    }
    const feature = await createFeature(title, description);
    return NextResponse.json(feature, { status: 201 });
  } catch (error) {
    console.error('Error creating feature:', error);
    return NextResponse.json({ error: 'Failed to create feature' }, { status: 500 });
  }
}
