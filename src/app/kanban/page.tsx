'use client';
import { useState } from 'react';
import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import NewFeatureForm from '@/components/kanban/NewFeatureForm';

export default function KanbanPage() {
  const [showForm, setShowForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleAdd = () => {
    setShowForm(false);
    setRefreshKey(k => k + 1);
  };

  return (
    <div
      className="min-h-screen px-6 py-8"
      style={{ backgroundColor: 'oklch(0.15 0.02 260)', color: 'oklch(0.95 0.01 260)' }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold font-mono tracking-wider">FEATURE KANBAN</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setShowForm(!showForm)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm font-mono"
            >
              {showForm ? 'Cancel' : '+ New Feature'}
            </button>
          </div>
        </div>
        
        {showForm && <NewFeatureForm onAdd={handleAdd} />}
        
        <div key={refreshKey}>
          <KanbanBoard />
        </div>
      </div>
    </div>
  );
}
