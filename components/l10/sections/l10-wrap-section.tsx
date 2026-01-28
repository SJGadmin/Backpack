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
import { useWrapFeedback, useWrapScores } from '../use-l10-storage';
import { L10SectionPresence } from '../l10-presence';
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
  feedback: initialFeedback,
  scores: initialScores,
  users,
  onUpdate,
}: L10WrapSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [newWorked, setNewWorked] = useState('');
  const [newSucked, setNewSucked] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  const {
    feedback: liveFeedback,
    updateFeedback: updateLiveFeedback,
    addFeedback: addLiveFeedback,
    deleteFeedback: deleteLiveFeedback,
    setFocused,
  } = useWrapFeedback();

  const {
    scores: liveScores,
    updateScore: updateLiveScore,
    addScore: addLiveScore,
  } = useWrapScores();

  // Use live data if available, otherwise fall back to initial
  const feedback = liveFeedback ?? initialFeedback.map((f) => ({
    id: f.id,
    type: f.type as 'positive' | 'negative',
    text: f.text,
    orderIndex: f.orderIndex,
  }));

  const scores = liveScores ?? initialScores.map((s) => ({
    id: s.id,
    userId: s.userId,
    score: s.score,
  }));

  // Map 'worked'/'sucked' to 'positive'/'negative' for filtering
  const workedFeedback = feedback.filter((f) => f.type === 'positive' || (f as any).type === 'worked');
  const suckedFeedback = feedback.filter((f) => f.type === 'negative' || (f as any).type === 'sucked');

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

    // Generate a temporary ID for optimistic update
    const tempId = `temp-${Date.now()}`;
    const liveType = type === 'worked' ? 'positive' : 'negative';
    const newFeedbackItem = {
      id: tempId,
      type: liveType as 'positive' | 'negative',
      text: text.trim(),
      orderIndex: feedback.length,
    };

    // Add to Liveblocks immediately
    addLiveFeedback(newFeedbackItem);
    if (type === 'worked') {
      setNewWorked('');
    } else {
      setNewSucked('');
    }

    try {
      await createWrapFeedback(documentId, type, text.trim());
      // Remove the temp feedback before refresh adds the real one
      deleteLiveFeedback(tempId);
      onUpdate(); // Refresh to get the real ID
    } catch (error) {
      toast.error('Failed to add feedback');
      deleteLiveFeedback(tempId); // Remove optimistic update on error
    }
  };

  const handleSaveFeedback = async (feedbackId: string) => {
    if (!editingText.trim()) {
      setEditingId(null);
      return;
    }

    const originalFeedback = feedback.find((f) => f.id === feedbackId);
    if (!originalFeedback || originalFeedback.text === editingText.trim()) {
      setEditingId(null);
      return;
    }

    // Update Liveblocks immediately
    updateLiveFeedback(feedbackId, editingText.trim());
    setEditingId(null);

    try {
      await updateWrapFeedback(feedbackId, editingText.trim());
    } catch (error) {
      // Revert on error
      updateLiveFeedback(feedbackId, originalFeedback.text);
      toast.error('Failed to update feedback');
    }
  };

  const handleDeleteFeedback = async (feedbackId: string) => {
    const originalFeedback = feedback.find((f) => f.id === feedbackId);
    // Delete from Liveblocks immediately
    deleteLiveFeedback(feedbackId);

    try {
      await deleteWrapFeedback(feedbackId);
    } catch (error) {
      // Revert on error
      if (originalFeedback) {
        addLiveFeedback(originalFeedback);
      }
      toast.error('Failed to delete feedback');
    }
  };

  const handleScoreChange = async (userId: string, score: number) => {
    if (score < 1 || score > 10) return;

    const existingScore = scores.find((s) => s.userId === userId);

    if (existingScore) {
      // Update Liveblocks immediately
      updateLiveScore(existingScore.id, score);
    } else {
      // Add new score to Liveblocks
      const tempId = `temp-${userId}`;
      addLiveScore({ id: tempId, userId, score });
    }

    try {
      await upsertWrapScore(documentId, userId, score);
      onUpdate(); // Refresh to get the real ID if new
    } catch (error) {
      // Revert on error - scores will be refreshed from server
      toast.error('Failed to update score');
    }
  };

  const getScore = (userId: string) => {
    const score = scores.find((s) => s.userId === userId);
    return score?.score || '';
  };

  const handleFocus = () => setFocused(true);
  const handleBlurFocus = () => setFocused(false);

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
        <L10SectionPresence section="Wrap" />
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
                      onFocus={handleFocus}
                      onBlur={() => {
                        handleSaveFeedback(item.id);
                        handleBlurFocus();
                      }}
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
                onFocus={handleFocus}
                onBlur={handleBlurFocus}
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
                      onFocus={handleFocus}
                      onBlur={() => {
                        handleSaveFeedback(item.id);
                        handleBlurFocus();
                      }}
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
                onFocus={handleFocus}
                onBlur={handleBlurFocus}
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
