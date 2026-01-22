'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Target, Plus, X, Circle, ArrowRightLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { createRock, updateRock, deleteRock } from '@/lib/actions/l10';
import { useRocks } from '../use-l10-storage';
import { L10SectionPresence } from '../l10-presence';
import type { L10Rock, UserInfo } from '@/lib/types';

interface L10RocksSectionProps {
  documentId: string;
  rocks: L10Rock[];
  users: UserInfo[];
  onUpdate: () => void;
  onCarryForward?: () => void;
}

export function L10RocksSection({
  documentId,
  rocks: initialRocks,
  users,
  onUpdate,
  onCarryForward,
}: L10RocksSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [newRockUserId, setNewRockUserId] = useState<string>('');
  const [newRockTitle, setNewRockTitle] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  const {
    rocks: liveRocks,
    updateRock: updateLiveRock,
    addRock: addLiveRock,
    deleteRock: deleteLiveRock,
    setFocused,
  } = useRocks();

  // Use live rocks if available, otherwise fall back to initial
  const rocks = liveRocks ?? initialRocks.map((r) => ({
    id: r.id,
    userId: r.userId,
    title: r.title,
    isOnTrack: r.isOnTrack,
    orderIndex: r.orderIndex,
  }));

  // Group rocks by user
  const rocksByUser = users.reduce((acc, user) => {
    acc[user.id] = rocks.filter((r) => r.userId === user.id);
    return acc;
  }, {} as Record<string, typeof rocks>);

  const handleAddRock = async () => {
    if (!newRockUserId || !newRockTitle.trim()) {
      toast.error('Please select a user and enter a rock title');
      return;
    }

    // Generate a temporary ID for optimistic update
    const tempId = `temp-${Date.now()}`;
    const newRock = {
      id: tempId,
      userId: newRockUserId,
      title: newRockTitle.trim(),
      isOnTrack: true,
      orderIndex: rocks.length,
    };

    // Add to Liveblocks immediately
    addLiveRock(newRock);
    setNewRockTitle('');

    try {
      await createRock(documentId, newRockUserId, newRockTitle.trim());
      onUpdate(); // Refresh to get the real ID
    } catch (error) {
      toast.error('Failed to add rock');
      deleteLiveRock(tempId); // Remove optimistic update on error
    }
  };

  const handleToggleStatus = async (rock: typeof rocks[0]) => {
    const newStatus = !rock.isOnTrack;
    // Update Liveblocks immediately
    updateLiveRock(rock.id, { isOnTrack: newStatus });

    try {
      await updateRock(rock.id, { isOnTrack: newStatus });
    } catch (error) {
      // Revert on error
      updateLiveRock(rock.id, { isOnTrack: rock.isOnTrack });
      toast.error('Failed to update rock status');
    }
  };

  const handleSaveTitle = async (rockId: string) => {
    if (!editingTitle.trim()) {
      setEditingId(null);
      return;
    }

    const originalRock = rocks.find((r) => r.id === rockId);
    if (!originalRock || originalRock.title === editingTitle.trim()) {
      setEditingId(null);
      return;
    }

    // Update Liveblocks immediately
    updateLiveRock(rockId, { title: editingTitle.trim() });
    setEditingId(null);

    try {
      await updateRock(rockId, { title: editingTitle.trim() });
    } catch (error) {
      // Revert on error
      updateLiveRock(rockId, { title: originalRock.title });
      toast.error('Failed to update rock');
    }
  };

  const handleDeleteRock = async (rockId: string) => {
    const originalRock = rocks.find((r) => r.id === rockId);
    // Delete from Liveblocks immediately
    deleteLiveRock(rockId);

    try {
      await deleteRock(rockId);
    } catch (error) {
      // Revert on error
      if (originalRock) {
        addLiveRock(originalRock);
      }
      toast.error('Failed to delete rock');
    }
  };

  const handleFocus = () => setFocused(true);
  const handleBlurFocus = () => setFocused(false);

  return (
    <div className="bg-card rounded-lg border">
      <div className="flex items-center">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex-1 flex items-center gap-2 p-4 hover:bg-accent/50 transition-colors"
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
          <Target className="h-4 w-4 text-primary" />
          <h2 className="font-semibold">Rocks</h2>
          <span className="text-sm text-muted-foreground ml-2">
            (Quarterly goals)
          </span>
          <L10SectionPresence section="Rocks" />
          <div className="flex items-center gap-4 ml-auto">
            <span className="flex items-center gap-1 text-sm">
              <Circle className="h-3 w-3 fill-green-500 text-green-500" />
              On Track
            </span>
          <span className="flex items-center gap-1 text-sm">
            <Circle className="h-3 w-3 fill-red-500 text-red-500" />
            Off Track
          </span>
          </div>
        </button>
        {onCarryForward && (
          <Button
            variant="ghost"
            size="sm"
            className="mr-2"
            onClick={onCarryForward}
            title="Carry forward from last meeting"
          >
            <ArrowRightLeft className="h-4 w-4" />
          </Button>
        )}
      </div>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-4">
          {users.map((user) => (
            <div key={user.id} className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground">
                {user.name}
              </h3>
              <div className="flex flex-wrap gap-2">
                {rocksByUser[user.id]?.map((rock) => (
                  <div
                    key={rock.id}
                    className="flex items-center gap-2 bg-accent/50 rounded-md px-3 py-1.5 group"
                  >
                    <button
                      onClick={() => handleToggleStatus(rock)}
                      className="flex-shrink-0"
                    >
                      <Circle
                        className={`h-3 w-3 ${
                          rock.isOnTrack
                            ? 'fill-green-500 text-green-500'
                            : 'fill-red-500 text-red-500'
                        }`}
                      />
                    </button>
                    {editingId === rock.id ? (
                      <Input
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onFocus={handleFocus}
                        onBlur={() => {
                          handleSaveTitle(rock.id);
                          handleBlurFocus();
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveTitle(rock.id);
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                        className="h-6 text-sm px-1"
                        autoFocus
                      />
                    ) : (
                      <span
                        onClick={() => {
                          setEditingId(rock.id);
                          setEditingTitle(rock.title);
                        }}
                        className="text-sm cursor-pointer hover:underline"
                      >
                        {rock.title}
                      </span>
                    )}
                    <button
                      onClick={() => handleDeleteRock(rock.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Add new rock */}
          <div className="flex items-center gap-2 pt-2 border-t">
            <Select value={newRockUserId} onValueChange={setNewRockUserId}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="User" />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              value={newRockTitle}
              onChange={(e) => setNewRockTitle(e.target.value)}
              onFocus={handleFocus}
              onBlur={handleBlurFocus}
              placeholder="Rock title"
              className="flex-1"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddRock();
              }}
            />
            <Button size="sm" onClick={handleAddRock}>
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
