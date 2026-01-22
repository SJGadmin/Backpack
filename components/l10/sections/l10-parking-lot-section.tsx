'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, ParkingCircle, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  createParkingLotItem,
  updateParkingLotItem,
  deleteParkingLotItem,
} from '@/lib/actions/l10';
import { useParkingLotItems } from '../use-l10-storage';
import { L10SectionPresence } from '../l10-presence';
import type { L10ParkingLotItem } from '@/lib/types';

interface L10ParkingLotSectionProps {
  documentId: string;
  items: L10ParkingLotItem[];
  onUpdate: () => void;
}

export function L10ParkingLotSection({
  documentId,
  items: initialItems,
  onUpdate,
}: L10ParkingLotSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [newItemText, setNewItemText] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  const {
    items: liveItems,
    updateItem: updateLiveItem,
    addItem: addLiveItem,
    deleteItem: deleteLiveItem,
    setFocused,
  } = useParkingLotItems();

  // Use live items if available, otherwise fall back to initial
  const items = liveItems ?? initialItems.map((i) => ({
    id: i.id,
    text: i.text,
    orderIndex: i.orderIndex,
  }));

  const handleAddItem = async () => {
    if (!newItemText.trim()) {
      toast.error('Please enter an item');
      return;
    }

    // Generate a temporary ID for optimistic update
    const tempId = `temp-${Date.now()}`;
    const newItem = {
      id: tempId,
      text: newItemText.trim(),
      orderIndex: items.length,
    };

    // Add to Liveblocks immediately
    addLiveItem(newItem);
    setNewItemText('');

    try {
      await createParkingLotItem(documentId, newItemText.trim());
      onUpdate(); // Refresh to get the real ID
    } catch (error) {
      toast.error('Failed to add item');
      deleteLiveItem(tempId); // Remove optimistic update on error
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

    // Update Liveblocks immediately
    updateLiveItem(itemId, editingText.trim());
    setEditingId(null);

    try {
      await updateParkingLotItem(itemId, editingText.trim());
    } catch (error) {
      // Revert on error
      updateLiveItem(itemId, originalItem.text);
      toast.error('Failed to update item');
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    const originalItem = items.find((i) => i.id === itemId);
    // Delete from Liveblocks immediately
    deleteLiveItem(itemId);

    try {
      await deleteParkingLotItem(itemId);
    } catch (error) {
      // Revert on error
      if (originalItem) {
        addLiveItem(originalItem);
      }
      toast.error('Failed to delete item');
    }
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
        <ParkingCircle className="h-4 w-4 text-primary" />
        <h2 className="font-semibold">Parking Lot</h2>
        <span className="text-sm text-muted-foreground ml-2">
          (Stuff that matters, just not today.)
        </span>
        <L10SectionPresence section="Parking Lot" />
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-2">
          <div className="space-y-1">
            {items.length === 0 && (
              <p className="text-sm text-muted-foreground italic py-2">
                No items in parking lot
              </p>
            )}
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-2 group py-1">
                <span className="text-muted-foreground">•</span>
                {editingId === item.id ? (
                  <Input
                    value={editingText}
                    onChange={(e) => setEditingText(e.target.value)}
                    onFocus={handleFocus}
                    onBlur={() => {
                      handleSaveItem(item.id);
                      handleBlurFocus();
                    }}
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
            ))}
          </div>

          {/* Add new item */}
          <div className="flex items-center gap-2 pt-2 border-t">
            <Input
              value={newItemText}
              onChange={(e) => setNewItemText(e.target.value)}
              onFocus={handleFocus}
              onBlur={handleBlurFocus}
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
