'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { createL10Folder, updateL10Folder, deleteL10Folder } from '@/lib/actions/l10';
import type { L10FolderWithCount } from '@/lib/types';

interface L10FolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folder?: L10FolderWithCount | null;
  onSuccess: () => void;
}

export function L10FolderDialog({
  open,
  onOpenChange,
  folder,
  onSuccess,
}: L10FolderDialogProps) {
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setName(folder?.name || '');
    }
  }, [open, folder]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error('Please enter a folder name');
      return;
    }

    setIsSubmitting(true);
    try {
      if (folder) {
        await updateL10Folder(folder.id, name.trim());
        toast.success('Folder updated');
      } else {
        await createL10Folder(name.trim());
        toast.success('Folder created');
      }
      onSuccess();
    } catch (error) {
      toast.error(folder ? 'Failed to update folder' : 'Failed to create folder');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!folder) return;

    if (folder._count.documents > 0) {
      const confirmed = window.confirm(
        `This folder contains ${folder._count.documents} meeting(s). Are you sure you want to delete it? This action cannot be undone.`
      );
      if (!confirmed) return;
    }

    setIsSubmitting(true);
    try {
      await deleteL10Folder(folder.id);
      toast.success('Folder deleted');
      onSuccess();
    } catch (error) {
      toast.error('Failed to delete folder');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{folder ? 'Edit Folder' : 'New Folder'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="folder-name">Folder Name</Label>
            <Input
              id="folder-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Q1 2025"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSubmit();
                }
              }}
            />
          </div>
        </div>
        <DialogFooter className="flex justify-between">
          {folder && (
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isSubmitting}
            >
              Delete
            </Button>
          )}
          <div className="flex gap-2 ml-auto">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {folder ? 'Update' : 'Create'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
