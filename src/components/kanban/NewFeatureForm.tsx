'use client';
import { useState } from 'react';

export default function NewFeatureForm({ onAdd }: { onAdd: () => void }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

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
      setShowForm(false);
      onAdd();
    } catch (e) {
      console.error('Failed to create:', e);
    } finally {
      setSubmitting(false);
    }
  };

  if (!showForm) {
    return (
      <button
        onClick={() => setShowForm(true)}
        className="rounded bg-sky-600 px-3 py-2 text-sm text-white hover:bg-sky-700"
      >
        + New Feature
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
      <input
        type="text"
        placeholder="Feature title..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full bg-gray-700 text-white rounded px-3 py-2 mb-2 text-sm"
        autoFocus
      />
      <textarea
        placeholder="Description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="w-full bg-gray-700 text-white rounded px-3 py-2 mb-2 text-sm"
        rows={2}
      />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={!title.trim() || submitting}
          className="bg-sky-600 hover:bg-sky-700 disabled:bg-gray-600 text-white rounded px-4 py-2 text-sm"
        >
          {submitting ? 'Adding...' : 'Add'}
        </button>
        <button
          type="button"
          onClick={() => setShowForm(false)}
          className="bg-gray-700 hover:bg-gray-600 text-white rounded px-4 py-2 text-sm"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
