'use client';

import { useState, useEffect, useRef } from 'react';
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
  rocks,
  users,
  onUpdate,
  onCarryForward,
}: L10RocksSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [newRockUserId, setNewRockUserId] = useState<string>('');
  const [newRockTitle, setNewRockTitle] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [localRocks, setLocalRocks] = useState<L10Rock[]>(rocks);
  const pendingSavesRef = useRef<Set<string>>(new Set());

  // Sync local state with props when not pending saves
  useEffect(() => {
    if (pendingSavesRef.current.size === 0) {
      setLocalRocks(rocks);
    } else {
      // Only update rocks that aren't being saved
      setLocalRocks((prev) =>
        prev.map((r) =>
          pendingSavesRef.current.has(r.id)
            ? r
            : rocks.find((pr) => pr.id === r.id) || r
        )
      );
    }
  }, [rocks]);

  // Group rocks by user
  const rocksByUser = users.reduce((acc, user) => {
    acc[user.id] = localRocks.filter((r) => r.userId === user.id);
    return acc;
  }, {} as Record<string, L10Rock[]>);

  const handleAddRock = async () => {
    if (!newRockUserId || !newRockTitle.trim()) {
      toast.error('Please select a user and enter a rock title');
      return;
    }

    try {
      await createRock(documentId, newRockUserId, newRockTitle.trim());
      setNewRockTitle('');
      onUpdate();
    } catch (error) {
      toast.error('Failed to add rock');
    }
  };

  const handleToggleStatus = async (rock: L10Rock) => {
    // Optimistic update
    const newStatus = !rock.isOnTrack;
    setLocalRocks((prev) =>
      prev.map((r) => (r.id === rock.id ? { ...r, isOnTrack: newStatus } : r))
    );
    pendingSavesRef.current.add(rock.id);

    try {
      await updateRock(rock.id, { isOnTrack: newStatus });
    } catch (error) {
      // Revert on error
      setLocalRocks((prev) =>
        prev.map((r) => (r.id === rock.id ? { ...r, isOnTrack: rock.isOnTrack } : r))
      );
      toast.error('Failed to update rock status');
    } finally {
      setTimeout(() => {
        pendingSavesRef.current.delete(rock.id);
      }, 1000);
    }
  };

  const handleSaveTitle = async (rockId: string) => {
    if (!editingTitle.trim()) {
      setEditingId(null);
      return;
    }

    const originalRock = localRocks.find((r) => r.id === rockId);
    if (!originalRock || originalRock.title === editingTitle.trim()) {
      setEditingId(null);
      return;
    }

    // Optimistic update
    setLocalRocks((prev) =>
      prev.map((r) => (r.id === rockId ? { ...r, title: editingTitle.trim() } : r))
    );
    pendingSavesRef.current.add(rockId);
    setEditingId(null);

    try {
      await updateRock(rockId, { title: editingTitle.trim() });
    } catch (error) {
      // Revert on error
      setLocalRocks((prev) =>
        prev.map((r) => (r.id === rockId ? { ...r, title: originalRock.title } : r))
      );
      toast.error('Failed to update rock');
    } finally {
      setTimeout(() => {
        pendingSavesRef.current.delete(rockId);
      }, 1000);
    }
  };

  const handleDeleteRock = async (rockId: string) => {
    // Optimistic update
    const originalRocks = [...localRocks];
    setLocalRocks((prev) => prev.filter((r) => r.id !== rockId));

    try {
      await deleteRock(rockId);
    } catch (error) {
      // Revert on error
      setLocalRocks(originalRocks);
      toast.error('Failed to delete rock');
    }
  };

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
                        onBlur={() => handleSaveTitle(rock.id)}
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
