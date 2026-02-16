'use client';
import { useState } from 'react';

export default function NewFeatureForm({ onAdd }: { onAdd: () => void }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    try {
      await fetch('/api/kanban', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), description: description.trim() || undefined }),
      });
      setTitle('');
      setDescription('');
      onAdd();
    } catch (e) {
      console.error('Failed to create:', e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gray-800 rounded-lg p-4 mb-4">
      <input
        type="text"
        placeholder="Feature title..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full bg-gray-700 text-white rounded px-3 py-2 mb-2 text-sm"
      />
      <textarea
        placeholder="Description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="w-full bg-gray-700 text-white rounded px-3 py-2 mb-2 text-sm"
        rows={2}
      />
      <button
        type="submit"
        disabled={!title.trim() || submitting}
        className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded px-4 py-2 text-sm"
      >
        {submitting ? 'Adding...' : 'Add Feature'}
      </button>
    </form>
  );
}
