'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ArrowRight, Circle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import {
  getPreviousMeetingTodos,
  carryForwardTodosFromPreviousMeeting,
  getPreviousMeetingRocks,
  carryForwardRocksFromPreviousMeeting,
} from '@/lib/actions/l10';
import { useRocks, useLastWeekTodos } from './use-l10-storage';
import type { L10NewTodo, L10Rock } from '@/lib/types';

interface L10CarryForwardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folderId: string;
  currentDocumentId: string;
  mode: 'todos' | 'rocks';
  onSuccess: () => void;
}

type PreviousDocument = {
  id: string;
  title: string;
  meetingDate: Date;
  weekNumber: number | null;
};

export function L10CarryForwardDialog({
  open,
  onOpenChange,
  folderId,
  currentDocumentId,
  mode,
  onSuccess,
}: L10CarryForwardDialogProps) {
  const [previousDoc, setPreviousDoc] = useState<PreviousDocument | null>(null);
  const [todos, setTodos] = useState<L10NewTodo[]>([]);
  const [rocks, setRocks] = useState<L10Rock[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get Liveblocks mutations for syncing
  const { addRocks } = useRocks();
  const { addTodos: addLastWeekTodos } = useLastWeekTodos();

  // Load data on open
  useEffect(() => {
    if (open) {
      loadData();
    } else {
      // Reset state on close
      setPreviousDoc(null);
      setTodos([]);
      setRocks([]);
      setSelectedIds(new Set());
    }
  }, [open, folderId, currentDocumentId, mode]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      if (mode === 'todos') {
        const data = await getPreviousMeetingTodos(folderId, currentDocumentId);
        setPreviousDoc(data.document);
        setTodos(data.todos);
        // Select all by default
        setSelectedIds(new Set(data.todos.map((t) => t.id)));
      } else {
        const data = await getPreviousMeetingRocks(folderId, currentDocumentId);
        setPreviousDoc(data.document);
        setRocks(data.rocks);
        // Select all by default
        setSelectedIds(new Set(data.rocks.map((r) => r.id)));
      }
    } catch (error) {
      toast.error('Failed to load previous meeting data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    const items = mode === 'todos' ? todos : rocks;
    setSelectedIds(new Set(items.map((i) => i.id)));
  };

  const handleDeselectAll = () => {
    setSelectedIds(new Set());
  };

  const handleSubmit = async () => {
    if (selectedIds.size === 0) {
      toast.error(`Please select at least one ${mode === 'todos' ? 'to-do' : 'rock'}`);
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === 'todos') {
        const createdTodos = await carryForwardTodosFromPreviousMeeting(
          folderId,
          currentDocumentId,
          Array.from(selectedIds)
        );
        // Sync to Liveblocks immediately so they appear without page refresh
        if (createdTodos && createdTodos.length > 0) {
          addLastWeekTodos(createdTodos.map((t) => ({
            id: t.id,
            userId: t.userId,
            text: t.text,
            isDone: t.isDone,
            orderIndex: t.orderIndex,
          })));
        }
        toast.success(`${selectedIds.size} to-do(s) carried forward`);
      } else {
        const createdRocks = await carryForwardRocksFromPreviousMeeting(
          folderId,
          currentDocumentId,
          Array.from(selectedIds)
        );
        // Sync to Liveblocks immediately so they appear without page refresh
        if (createdRocks && createdRocks.length > 0) {
          addRocks(createdRocks.map((r) => ({
            id: r.id,
            userId: r.userId,
            title: r.title,
            isOnTrack: r.isOnTrack,
            orderIndex: r.orderIndex,
          })));
        }
        toast.success(`${selectedIds.size} rock(s) carried forward`);
      }
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      toast.error(`Failed to carry forward ${mode}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const items = mode === 'todos' ? todos : rocks;

  // Group items by user
  const itemsByUser = items.reduce((acc, item) => {
    const userId = item.userId;
    if (!acc[userId]) {
      acc[userId] = { user: item.user, items: [] };
    }
    acc[userId].items.push(item);
    return acc;
  }, {} as Record<string, { user: { id: string; name: string; email: string } | null; items: (L10NewTodo | L10Rock)[] }>);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            Carry Forward {mode === 'todos' ? 'To-Dos' : 'Rocks'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'todos'
              ? "Select to-dos from last week to bring into this week's \"Last Week To-Dos\" section."
              : "Select rocks from last week to bring into this week's meeting."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <p className="text-muted-foreground">Loading...</p>
            </div>
          ) : !previousDoc ? (
            <div className="flex items-center justify-center h-48">
              <p className="text-muted-foreground">
                No previous meeting found in this folder.
              </p>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                No {mode === 'todos' ? 'to-dos' : 'rocks'} in the previous meeting
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {previousDoc.weekNumber
                  ? `Week ${previousDoc.weekNumber}`
                  : format(new Date(previousDoc.meetingDate), 'MMM d, yyyy')}
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  From: {previousDoc.weekNumber
                    ? `Week ${previousDoc.weekNumber}`
                    : format(new Date(previousDoc.meetingDate), 'MMM d, yyyy')}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSelectAll}
                    className="h-7 text-xs"
                  >
                    Select All
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDeselectAll}
                    className="h-7 text-xs"
                  >
                    Deselect All
                  </Button>
                </div>
              </div>

              <ScrollArea className="h-64 rounded-md border p-3">
                <div className="space-y-4">
                  {Object.entries(itemsByUser).map(([userId, { user, items: userItems }]) => (
                    <div key={userId} className="space-y-2">
                      <h4 className="text-sm font-semibold text-muted-foreground">
                        {user?.name || 'Unknown'}
                      </h4>
                      <div className="space-y-1 pl-2">
                        {userItems.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center gap-2 py-1"
                          >
                            <Checkbox
                              checked={selectedIds.has(item.id)}
                              onCheckedChange={() => handleToggle(item.id)}
                            />
                            {mode === 'rocks' && 'isOnTrack' in item && (
                              <Circle
                                className={`h-3 w-3 flex-shrink-0 ${
                                  item.isOnTrack
                                    ? 'fill-green-500 text-green-500'
                                    : 'fill-red-500 text-red-500'
                                }`}
                              />
                            )}
                            <span className="text-sm flex-1">
                              {'text' in item ? item.text : item.title}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || selectedIds.size === 0 || !previousDoc}
          >
            <ArrowRight className="h-4 w-4 mr-1" />
            Carry Forward ({selectedIds.size})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
