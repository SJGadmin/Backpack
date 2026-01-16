'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { updateSegueEntry } from '@/lib/actions/l10';
import type { L10SegueEntry, UserInfo } from '@/lib/types';

interface L10SegueSectionProps {
  documentId: string;
  entries: L10SegueEntry[];
  users: UserInfo[];
  onUpdate: () => void;
}

export function L10SegueSection({
  documentId,
  entries,
  users,
  onUpdate,
}: L10SegueSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [localEntries, setLocalEntries] = useState<Record<string, string>>({});

  // Get entry text for a user
  const getEntryText = (userId: string) => {
    if (localEntries[userId] !== undefined) {
      return localEntries[userId];
    }
    const entry = entries.find((e) => e.userId === userId);
    return entry?.text || '';
  };

  const handleChange = (userId: string, text: string) => {
    setLocalEntries((prev) => ({ ...prev, [userId]: text }));
  };

  const handleBlur = async (userId: string) => {
    const text = localEntries[userId];
    if (text === undefined) return;

    const existingEntry = entries.find((e) => e.userId === userId);
    if (existingEntry?.text === text) return;

    try {
      await updateSegueEntry(documentId, userId, text);
      onUpdate();
    } catch (error) {
      console.error('Failed to update segue entry:', error);
    }
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
                onBlur={() => handleBlur(user.id)}
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
