'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import {
  ChevronDown,
  ChevronRight,
  AlertCircle,
  Plus,
  X,
  Check,
  User,
  Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { createIdsIssue, deleteIdsIssue } from '@/lib/actions/l10';
import { useIdsIssues } from '../use-l10-storage';
import { L10SectionPresence } from '../l10-presence';
import type { L10IdsIssue, UserInfo } from '@/lib/types';
import { L10IdsIssueSheet } from './l10-ids-issue-sheet';

interface L10IdsSectionProps {
  documentId: string;
  issues: L10IdsIssue[];
  users: UserInfo[];
  onUpdate: () => void;
}

export function L10IdsSection({
  documentId,
  issues: initialIssues,
  users,
  onUpdate,
}: L10IdsSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [newIssueTitle, setNewIssueTitle] = useState('');
  const [selectedIssue, setSelectedIssue] = useState<L10IdsIssue | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const {
    issues: liveIssues,
    updateIssue: updateLiveIssue,
    addIssue: addLiveIssue,
    deleteIssue: deleteLiveIssue,
    setFocused,
  } = useIdsIssues();

  // Use live issues if available, otherwise fall back to initial
  // Note: We need to merge with initialIssues to get the owner object and issueNumber
  // Convert live issues (string dueDate) to L10IdsIssue format (Date dueDate)
  const issues: L10IdsIssue[] = liveIssues
    ? liveIssues.map((li) => {
        const initial = initialIssues.find((i) => i.id === li.id);
        return {
          id: li.id,
          documentId: initial?.documentId ?? documentId,
          issueNumber: initial?.issueNumber ?? 0,
          title: li.title,
          identify: li.identify,
          discuss: li.discuss,
          solve: li.solve,
          ownerId: li.ownerId,
          owner: li.ownerId ? users.find((u) => u.id === li.ownerId) ?? null : null,
          dueDate: li.dueDate ? new Date(li.dueDate) : null,
          isResolved: li.isResolved,
          orderIndex: li.orderIndex,
          createdAt: initial?.createdAt ?? new Date(),
          updatedAt: initial?.updatedAt ?? new Date(),
        };
      })
    : initialIssues;

  // Update selected issue when live data changes
  const currentSelectedIssue = selectedIssue
    ? issues.find((i) => i.id === selectedIssue.id) ?? selectedIssue
    : null;

  const handleAddIssue = async () => {
    if (!newIssueTitle.trim()) {
      toast.error('Please enter an issue title');
      return;
    }

    // Generate a temporary ID for optimistic update
    const tempId = `temp-${Date.now()}`;
    const newIssue = {
      id: tempId,
      title: newIssueTitle.trim(),
      identify: null,
      discuss: null,
      solve: null,
      ownerId: null,
      dueDate: null,
      isResolved: false,
      orderIndex: issues.length,
    };

    // Add to Liveblocks immediately
    addLiveIssue(newIssue);
    setNewIssueTitle('');

    try {
      await createIdsIssue(documentId, newIssueTitle.trim());
      onUpdate(); // Refresh to get the real ID and issueNumber
    } catch (error) {
      toast.error('Failed to add issue');
      deleteLiveIssue(tempId); // Remove optimistic update on error
    }
  };

  const handleDeleteIssue = async (issueId: string) => {
    const originalIssue = liveIssues?.find((i) => i.id === issueId);
    // Delete from Liveblocks immediately
    deleteLiveIssue(issueId);

    try {
      await deleteIdsIssue(issueId);
    } catch (error) {
      // Revert on error
      if (originalIssue) {
        addLiveIssue(originalIssue);
      }
      toast.error('Failed to delete issue');
    }
  };

  const handleIssueClick = (issue: L10IdsIssue) => {
    setSelectedIssue(issue);
    setIsSheetOpen(true);
  };

  const handleIssueUpdate = (updatedIssue: L10IdsIssue) => {
    // Update Liveblocks with the changed fields
    updateLiveIssue(updatedIssue.id, {
      title: updatedIssue.title,
      identify: updatedIssue.identify,
      discuss: updatedIssue.discuss,
      solve: updatedIssue.solve,
      ownerId: updatedIssue.ownerId,
      dueDate: updatedIssue.dueDate ? updatedIssue.dueDate.toString() : null,
      isResolved: updatedIssue.isResolved,
    });
    setSelectedIssue(updatedIssue);
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
        <AlertCircle className="h-4 w-4 text-primary" />
        <h2 className="font-semibold">IDS</h2>
        <span className="text-sm text-muted-foreground ml-2">
          (Identify, Discuss, Solve)
        </span>
        <L10SectionPresence section="IDS" />
        {issues.length > 0 && (
          <span className="text-sm text-muted-foreground ml-auto">
            {issues.filter((i) => i.isResolved).length}/{issues.length} resolved
          </span>
        )}
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-3">
          <p className="text-sm text-muted-foreground">
            Brain dump first, then pick the top 1-3.
          </p>

          {/* Issues list */}
          <div className="space-y-2">
            {issues.map((issue) => (
              <div
                key={issue.id}
                className={`flex items-center gap-3 p-2 rounded-md border cursor-pointer hover:bg-accent/50 transition-colors group ${
                  issue.isResolved ? 'opacity-60' : ''
                }`}
                onClick={() => handleIssueClick(issue)}
              >
                <span className="text-sm font-mono text-muted-foreground w-6">
                  {issue.issueNumber}.
                </span>
                {issue.isResolved && (
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                )}
                <span
                  className={`flex-1 text-sm ${
                    issue.isResolved ? 'line-through' : ''
                  }`}
                >
                  {issue.title}
                </span>
                {issue.owner && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {issue.owner.name}
                  </Badge>
                )}
                {issue.dueDate && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(issue.dueDate), 'MMM d')}
                  </Badge>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteIssue(issue.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                </button>
              </div>
            ))}
          </div>

          {/* Add new issue */}
          <div className="flex items-center gap-2 pt-2 border-t">
            <Input
              value={newIssueTitle}
              onChange={(e) => setNewIssueTitle(e.target.value)}
              onFocus={handleFocus}
              onBlur={handleBlurFocus}
              placeholder="New issue title"
              className="flex-1"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddIssue();
              }}
            />
            <Button size="sm" onClick={handleAddIssue}>
              <Plus className="h-4 w-4 mr-1" />
              Add Issue
            </Button>
          </div>
        </div>
      )}

      {/* Issue Detail Sheet */}
      <L10IdsIssueSheet
        issue={currentSelectedIssue}
        users={users}
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        onUpdate={onUpdate}
        onOptimisticUpdate={handleIssueUpdate}
      />
    </div>
  );
}
