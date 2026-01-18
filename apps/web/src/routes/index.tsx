import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { Settings, Plus, Trash2, Play, Edit } from 'lucide-react';
import {
  TimerPattern,
  formatDuration,
  calculatePatternDuration,
} from '@repo/shared';
import { storage } from '@/lib/storage';
import { cn } from '@/lib/utils';

export const Route = createFileRoute('/')({
  component: HomePage,
});

function HomePage() {
  const [patterns, setPatterns] = useState<TimerPattern[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    loadPatterns();
  }, []);

  const loadPatterns = async () => {
    try {
      const data = await storage.loadPatterns();
      setPatterns(data);
    } catch (error) {
      console.error('Failed to load patterns:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (patternId: string) => {
    await storage.deletePattern(patternId);
    loadPatterns();
    setDeleteConfirm(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="pt-12 px-6 pb-6">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-extrabold text-neutral-50 tracking-tight">
              Timers
            </h1>
            <p className="text-neutral-600 mt-1">Click to start, hover for options</p>
          </div>
          <Link
            to="/settings"
            className="p-3 rounded-xl bg-card border border-border hover:bg-background-tertiary transition-colors"
          >
            <Settings className="w-5 h-5 text-neutral-400" />
          </Link>
        </div>
      </header>

      {/* Pattern List */}
      <main className="px-6 pb-32">
        <div className="max-w-2xl mx-auto space-y-3">
          {loading ? (
            <div className="text-center py-12 text-neutral-500">Loading...</div>
          ) : patterns.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-xl font-semibold text-neutral-400">No timers yet</p>
              <p className="text-neutral-600 mt-2">Create your first programmable timer</p>
            </div>
          ) : (
            patterns.map((pattern) => (
              <PatternCard
                key={pattern.id}
                pattern={pattern}
                showDeleteConfirm={deleteConfirm === pattern.id}
                onDeleteClick={() => setDeleteConfirm(pattern.id)}
                onDeleteConfirm={() => handleDelete(pattern.id)}
                onDeleteCancel={() => setDeleteConfirm(null)}
              />
            ))
          )}
        </div>
      </main>

      {/* Create Button */}
      <div className="fixed bottom-6 left-6 right-6">
        <div className="max-w-2xl mx-auto">
          <Link
            to="/editor/$id"
            params={{ id: 'new' }}
            className="flex items-center justify-center gap-2 w-full bg-amber-500 hover:bg-amber-400 text-background font-bold py-4 rounded-xl transition-colors"
          >
            <Plus className="w-5 h-5" />
            New Timer
          </Link>
        </div>
      </div>
    </div>
  );
}

interface PatternCardProps {
  pattern: TimerPattern;
  showDeleteConfirm: boolean;
  onDeleteClick: () => void;
  onDeleteConfirm: () => void;
  onDeleteCancel: () => void;
}

function PatternCard({
  pattern,
  showDeleteConfirm,
  onDeleteClick,
  onDeleteConfirm,
  onDeleteCancel,
}: PatternCardProps) {
  const duration = calculatePatternDuration(pattern);
  const isInfinite = duration === -1;

  // Get preview colors from segments
  const previewColors = pattern.blocks
    .flatMap((block) => block.segments.map((seg) => seg.color))
    .slice(0, 5);

  // Get segment preview text
  const segmentNames = pattern.blocks
    .flatMap((block) => block.segments.map((seg) => seg.name))
    .slice(0, 3)
    .join(' → ');

  return (
    <div className="group relative bg-card rounded-xl border border-border overflow-hidden hover:border-border-light transition-colors">
      {/* Color bar */}
      <div className="flex h-1">
        {previewColors.map((color, i) => (
          <div key={i} className="flex-1" style={{ backgroundColor: color }} />
        ))}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-neutral-50 truncate">
              {pattern.name}
            </h3>
            <p className="text-sm text-neutral-500 truncate mt-1">{segmentNames}</p>
          </div>

          {/* Actions - visible on hover */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Link
              to="/editor/$id"
              params={{ id: pattern.id }}
              className="p-2 rounded-lg hover:bg-background-tertiary transition-colors"
            >
              <Edit className="w-4 h-4 text-neutral-400" />
            </Link>
            <button
              onClick={onDeleteClick}
              className="p-2 rounded-lg hover:bg-background-tertiary transition-colors"
            >
              <Trash2 className="w-4 h-4 text-neutral-400" />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between mt-3">
          <span className="text-amber-500 font-medium">
            {isInfinite ? '∞ Repeating' : formatDuration(duration)}
          </span>
          <span className="text-xs text-neutral-600">
            {pattern.blocks.length} block{pattern.blocks.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Play button overlay */}
        <Link
          to="/timer/$id"
          params={{ id: pattern.id }}
          className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/50 transition-opacity"
        >
          <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center">
            <Play className="w-8 h-8 text-neutral-900 ml-1" fill="currentColor" />
          </div>
        </Link>
      </div>

      {/* Delete confirmation */}
      {showDeleteConfirm && (
        <div className="absolute inset-0 bg-card/95 flex items-center justify-center p-4">
          <div className="text-center">
            <p className="text-neutral-200 mb-4">Delete "{pattern.name}"?</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={onDeleteCancel}
                className="px-4 py-2 rounded-lg bg-background-tertiary text-neutral-300 hover:bg-border transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onDeleteConfirm}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-500 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
