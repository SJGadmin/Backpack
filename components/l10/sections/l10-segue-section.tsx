'use client';

import { useState, useCallback } from 'react';
import { ChevronDown, ChevronRight, MessageSquare } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { updateSegueEntry } from '@/lib/actions/l10';
import { useSegueEntries } from '../use-l10-storage';
import { L10SectionPresence } from '../l10-presence';
import type { L10SegueEntry, UserInfo } from '@/lib/types';

interface L10SegueSectionProps {
  documentId: string;
  entries: L10SegueEntry[];
  users: UserInfo[];
  onUpdate: () => void;
}

export function L10SegueSection({
  documentId,
  entries: initialEntries,
  users,
}: L10SegueSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const { entries: liveEntries, updateEntryByUserId, setFocused } = useSegueEntries();

  // Use live entries if available, otherwise fall back to initial
  const entries = liveEntries ?? initialEntries.map((e) => ({
    id: e.id,
    userId: e.userId,
    text: e.text,
    orderIndex: e.orderIndex,
  }));

  const getEntryText = useCallback(
    (userId: string) => {
      const entry = entries?.find((e) => e.userId === userId);
      return entry?.text ?? '';
    },
    [entries]
  );

  const handleChange = (userId: string, text: string) => {
    // Update Liveblocks storage immediately for real-time sync
    updateEntryByUserId(userId, text);
  };

  const handleBlur = async (userId: string) => {
    const text = getEntryText(userId);
    // Also persist to database
    try {
      await updateSegueEntry(documentId, userId, text);
    } catch (error) {
      console.error('Failed to persist segue entry:', error);
    }
  };

  const handleFocus = () => {
    setFocused(true);
  };

  const handleBlurFocus = () => {
    setFocused(false);
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
        <MessageSquare className="h-4 w-4 text-primary" />
        <h2 className="font-semibold">Segue</h2>
        <span className="text-sm text-muted-foreground ml-2">
          (Quick check-in. No rabbit holes.)
        </span>
        <L10SectionPresence section="Segue" />
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-3">
          {users.map((user) => (
            <div key={user.id} className="flex gap-3">
              <div className="w-24 flex-shrink-0 pt-2">
                <span className="text-sm font-medium">{user.name}</span>
              </div>
              <Textarea
                value={getEntryText(user.id)}
                onChange={(e) => handleChange(user.id, e.target.value)}
                onFocus={handleFocus}
                onBlur={() => {
                  handleBlur(user.id);
                  handleBlurFocus();
                }}
                placeholder="What's on your mind?"
                className="min-h-[60px] resize-none"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
