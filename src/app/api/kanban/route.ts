import { NextRequest, NextResponse } from 'next/server';
import { createFeature, getFeatures } from '@/lib/kanban-db';

export async function GET() {
  try {
    const features = await getFeatures();
    const grouped = {
      planned: features.filter(f => f.column === 'planned'),
      in_progress: features.filter(f => f.column === 'in_progress'),
      completed: features.filter(f => f.column === 'completed'),
      on_hold: features.filter(f => f.column === 'on_hold'),
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
    const { title, description, priority } = body;
    if (!title) {
      return NextResponse.json({ error: 'Title required' }, { status: 400 });
    }
    const feature = await createFeature(title, description, priority);
    return NextResponse.json(feature, { status: 201 });
  } catch (error) {
    console.error('Error creating feature:', error);
    return NextResponse.json({ error: 'Failed to create feature' }, { status: 500 });
  }
}
