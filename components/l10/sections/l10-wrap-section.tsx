'use client';

import { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Sparkles,
  Plus,
  X,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  createWrapFeedback,
  updateWrapFeedback,
  deleteWrapFeedback,
  upsertWrapScore,
} from '@/lib/actions/l10';
import type { L10WrapFeedback, L10WrapScore, UserInfo } from '@/lib/types';

interface L10WrapSectionProps {
  documentId: string;
  feedback: L10WrapFeedback[];
  scores: L10WrapScore[];
  users: UserInfo[];
  onUpdate: () => void;
}

export function L10WrapSection({
  documentId,
  feedback,
  scores,
  users,
  onUpdate,
}: L10WrapSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [newWorked, setNewWorked] = useState('');
  const [newSucked, setNewSucked] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  const workedFeedback = feedback.filter((f) => f.type === 'worked');
  const suckedFeedback = feedback.filter((f) => f.type === 'sucked');

  // Calculate average score
  const avgScore =
    scores.length > 0
      ? (scores.reduce((sum, s) => sum + s.score, 0) / scores.length).toFixed(1)
      : '-';

  const handleAddFeedback = async (type: 'worked' | 'sucked') => {
    const text = type === 'worked' ? newWorked : newSucked;
    if (!text.trim()) {
      toast.error('Please enter feedback');
      return;
    }

    try {
      await createWrapFeedback(documentId, type, text.trim());
      if (type === 'worked') {
        setNewWorked('');
      } else {
        setNewSucked('');
      }
      onUpdate();
    } catch (error) {
      toast.error('Failed to add feedback');
    }
  };

  const handleSaveFeedback = async (feedbackId: string) => {
    if (!editingText.trim()) {
      setEditingId(null);
      return;
    }

    try {
      await updateWrapFeedback(feedbackId, editingText.trim());
      setEditingId(null);
      onUpdate();
    } catch (error) {
      toast.error('Failed to update feedback');
    }
  };

  const handleDeleteFeedback = async (feedbackId: string) => {
    try {
      await deleteWrapFeedback(feedbackId);
      onUpdate();
    } catch (error) {
      toast.error('Failed to delete feedback');
    }
  };

  const handleScoreChange = async (userId: string, score: number) => {
    if (score < 1 || score > 10) return;

    try {
      await upsertWrapScore(documentId, userId, score);
      onUpdate();
    } catch (error) {
      toast.error('Failed to update score');
    }
  };

  const getScore = (userId: string) => {
    const score = scores.find((s) => s.userId === userId);
    return score?.score || '';
  };

  return (
    <div className="bg-card rounded-lg border">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-2 p-4 hover:bg-accent/50 transition-colors"
      >
        {isExpanded ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
        <Sparkles className="h-4 w-4 text-primary" />
        <h2 className="font-semibold">Wrap</h2>
        {scores.length > 0 && (
          <span className="text-sm text-muted-foreground ml-auto">
            Avg score: {avgScore}
          </span>
        )}
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-6">
          {/* What worked */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <ThumbsUp className="h-4 w-4 text-green-500" />
              <Label className="font-medium">What worked today</Label>
            </div>
            <div className="space-y-1 pl-6">
              {workedFeedback.map((item) => (
                <div key={item.id} className="flex items-center gap-2 group">
                  <span className="text-muted-foreground">-</span>
                  {editingId === item.id ? (
                    <Input
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      onBlur={() => handleSaveFeedback(item.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveFeedback(item.id);
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      className="flex-1 h-7 text-sm"
                      autoFocus
                    />
                  ) : (
                    <span
                      onClick={() => {
                        setEditingId(item.id);
                        setEditingText(item.text);
                      }}
                      className="flex-1 text-sm cursor-pointer hover:underline"
                    >
                      {item.text}
                    </span>
                  )}
                  <button
                    onClick={() => handleDeleteFeedback(item.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 pl-6">
              <Input
                value={newWorked}
                onChange={(e) => setNewWorked(e.target.value)}
                placeholder="Add what worked..."
                className="flex-1"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddFeedback('worked');
                }}
              />
              <Button size="sm" onClick={() => handleAddFeedback('worked')}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* What sucked */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <ThumbsDown className="h-4 w-4 text-red-500" />
              <Label className="font-medium">What sucked / fix next time</Label>
            </div>
            <div className="space-y-1 pl-6">
              {suckedFeedback.map((item) => (
                <div key={item.id} className="flex items-center gap-2 group">
                  <span className="text-muted-foreground">-</span>
                  {editingId === item.id ? (
                    <Input
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      onBlur={() => handleSaveFeedback(item.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveFeedback(item.id);
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      className="flex-1 h-7 text-sm"
                      autoFocus
                    />
                  ) : (
                    <span
                      onClick={() => {
                        setEditingId(item.id);
                        setEditingText(item.text);
                      }}
                      className="flex-1 text-sm cursor-pointer hover:underline"
                    >
                      {item.text}
                    </span>
                  )}
                  <button
                    onClick={() => handleDeleteFeedback(item.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 pl-6">
              <Input
                value={newSucked}
                onChange={(e) => setNewSucked(e.target.value)}
                placeholder="Add what sucked..."
                className="flex-1"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddFeedback('sucked');
                }}
              />
              <Button size="sm" onClick={() => handleAddFeedback('sucked')}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Meeting scores */}
          <div className="space-y-2 pt-2 border-t">
            <Label className="font-medium">Meeting score (1-10)</Label>
            <div className="flex flex-wrap gap-4">
              {users.map((user) => (
                <div key={user.id} className="flex items-center gap-2">
                  <span className="text-sm font-medium w-16">{user.name}</span>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    value={getScore(user.id)}
                    onChange={(e) => {
                      const value = parseInt(e.target.value, 10);
                      if (!isNaN(value)) {
                        handleScoreChange(user.id, value);
                      }
                    }}
                    className="w-16"
                    placeholder="-"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
