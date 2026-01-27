'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, ParkingCircle, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  getGlobalParkingLotItems,
  createGlobalParkingLotItem,
  updateGlobalParkingLotItem,
  deleteGlobalParkingLotItem,
} from '@/lib/actions/l10';
import type { L10GlobalParkingLotItem } from '@/lib/types';

interface L10ParkingLotSectionProps {
  // No longer needs documentId or items props since it's global
  onUpdate?: () => void;
}

export function L10ParkingLotSection({
  onUpdate,
}: L10ParkingLotSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [items, setItems] = useState<L10GlobalParkingLotItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newItemText, setNewItemText] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  // Load global parking lot items on mount
  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      const data = await getGlobalParkingLotItems();
      setItems(data);
    } catch (error) {
      console.error('Failed to load parking lot items:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddItem = async () => {
    if (!newItemText.trim()) {
      toast.error('Please enter an item');
      return;
    }

    // Optimistic update
    const tempId = `temp-${Date.now()}`;
    const newItem: L10GlobalParkingLotItem = {
      id: tempId,
      text: newItemText.trim(),
      orderIndex: items.length,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setItems((prev) => [...prev, newItem]);
    setNewItemText('');

    try {
      const created = await createGlobalParkingLotItem(newItemText.trim());
      // Replace temp item with real one
      setItems((prev) => prev.map((i) => (i.id === tempId ? created : i)));
      onUpdate?.();
    } catch (error) {
      // Revert on error
      setItems((prev) => prev.filter((i) => i.id !== tempId));
      toast.error('Failed to add item');
    }
  };

  const handleSaveItem = async (itemId: string) => {
    if (!editingText.trim()) {
      setEditingId(null);
      return;
    }

    const originalItem = items.find((i) => i.id === itemId);
    if (!originalItem || originalItem.text === editingText.trim()) {
      setEditingId(null);
      return;
    }

    // Optimistic update
    setItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, text: editingText.trim() } : i))
    );
    setEditingId(null);

    try {
      await updateGlobalParkingLotItem(itemId, editingText.trim());
      onUpdate?.();
    } catch (error) {
      // Revert on error
      setItems((prev) =>
        prev.map((i) => (i.id === itemId ? originalItem : i))
      );
      toast.error('Failed to update item');
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    const originalItem = items.find((i) => i.id === itemId);

    // Optimistic update
    setItems((prev) => prev.filter((i) => i.id !== itemId));

    try {
      await deleteGlobalParkingLotItem(itemId);
      onUpdate?.();
    } catch (error) {
      // Revert on error
      if (originalItem) {
        setItems((prev) => [...prev, originalItem].sort((a, b) => a.orderIndex - b.orderIndex));
      }
      toast.error('Failed to delete item');
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
        <ParkingCircle className="h-4 w-4 text-primary" />
        <h2 className="font-semibold">Parking Lot</h2>
        <span className="text-sm text-muted-foreground ml-2">
          (Shared across all meetings)
        </span>
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-2">
          <div className="space-y-1">
            {isLoading ? (
              <p className="text-sm text-muted-foreground italic py-2">
                Loading...
              </p>
            ) : items.length === 0 ? (
              <p className="text-sm text-muted-foreground italic py-2">
                No items in parking lot
              </p>
            ) : (
              items.map((item) => (
                <div key={item.id} className="flex items-center gap-2 group py-1">
                  <span className="text-muted-foreground">•</span>
                  {editingId === item.id ? (
                    <Input
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      onBlur={() => handleSaveItem(item.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveItem(item.id);
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
                    onClick={() => handleDeleteItem(item.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Add new item */}
          <div className="flex items-center gap-2 pt-2 border-t">
            <Input
              value={newItemText}
              onChange={(e) => setNewItemText(e.target.value)}
              placeholder="Add to parking lot..."
              className="flex-1"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddItem();
              }}
            />
            <Button size="sm" onClick={handleAddItem}>
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
