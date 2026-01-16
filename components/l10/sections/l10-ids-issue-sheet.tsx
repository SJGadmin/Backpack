'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { CalendarIcon, Check } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { updateIdsIssue } from '@/lib/actions/l10';
import type { L10IdsIssue, UserInfo } from '@/lib/types';

interface L10IdsIssueSheetProps {
  issue: L10IdsIssue | null;
  users: UserInfo[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

export function L10IdsIssueSheet({
  issue,
  users,
  open,
  onOpenChange,
  onUpdate,
}: L10IdsIssueSheetProps) {
  const [title, setTitle] = useState('');
  const [identify, setIdentify] = useState('');
  const [discuss, setDiscuss] = useState('');
  const [solve, setSolve] = useState('');
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [isResolved, setIsResolved] = useState(false);

  // Update local state when issue changes
  useEffect(() => {
    if (issue) {
      setTitle(issue.title);
      setIdentify(issue.identify || '');
      setDiscuss(issue.discuss || '');
      setSolve(issue.solve || '');
      setOwnerId(issue.ownerId);
      setDueDate(issue.dueDate ? new Date(issue.dueDate) : null);
      setIsResolved(issue.isResolved);
    }
  }, [issue]);

  const handleSave = async (field: string, value: any) => {
    if (!issue) return;

    try {
      await updateIdsIssue(issue.id, { [field]: value });
      onUpdate();
    } catch (error) {
      toast.error('Failed to update issue');
    }
  };

  if (!issue) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl p-0">
        <ScrollArea className="h-full">
          <div className="p-6 space-y-6">
            <SheetHeader>
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono text-muted-foreground">
                  Issue #{issue.issueNumber}
                </span>
                <div className="flex items-center gap-2 ml-auto">
                  <Checkbox
                    id="resolved"
                    checked={isResolved}
                    onCheckedChange={(checked) => {
                      setIsResolved(!!checked);
                      handleSave('isResolved', !!checked);
                    }}
                  />
                  <Label htmlFor="resolved" className="text-sm">
                    Resolved
                  </Label>
                </div>
              </div>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={() => {
                  if (title !== issue.title) {
                    handleSave('title', title);
                  }
                }}
                className="text-xl font-bold border-0 px-0 focus-visible:ring-0"
                placeholder="Issue title"
              />
            </SheetHeader>

            {/* Owner and Due Date */}
            <div className="flex items-center gap-4">
              <div className="space-y-2">
                <Label>Owner</Label>
                <Select
                  value={ownerId || 'unassigned'}
                  onValueChange={(value) => {
                    const newOwnerId = value === 'unassigned' ? null : value;
                    setOwnerId(newOwnerId);
                    handleSave('ownerId', newOwnerId);
                  }}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Select owner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Due Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-40 justify-start">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dueDate ? format(dueDate, 'MMM d, yyyy') : 'Set date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dueDate || undefined}
                      onSelect={(date) => {
                        setDueDate(date || null);
                        handleSave('dueDate', date || null);
                      }}
                      initialFocus
                    />
                    {dueDate && (
                      <div className="p-2 border-t">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full"
                          onClick={() => {
                            setDueDate(null);
                            handleSave('dueDate', null);
                          }}
                        >
                          Clear date
                        </Button>
                      </div>
                    )}
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <Separator />

            {/* I - Identify */}
            <div className="space-y-2">
              <Label className="text-base font-semibold">
                I - Identify
              </Label>
              <p className="text-sm text-muted-foreground">
                What is the real issue? State the problem clearly.
              </p>
              <Textarea
                value={identify}
                onChange={(e) => setIdentify(e.target.value)}
                onBlur={() => {
                  if (identify !== (issue.identify || '')) {
                    handleSave('identify', identify || null);
                  }
                }}
                placeholder="The real issue is..."
                className="min-h-[100px]"
              />
            </div>

            {/* D - Discuss */}
            <div className="space-y-2">
              <Label className="text-base font-semibold">
                D - Discuss
              </Label>
              <p className="text-sm text-muted-foreground">
                Discuss openly. Everyone contributes. No tangents.
              </p>
              <Textarea
                value={discuss}
                onChange={(e) => setDiscuss(e.target.value)}
                onBlur={() => {
                  if (discuss !== (issue.discuss || '')) {
                    handleSave('discuss', discuss || null);
                  }
                }}
                placeholder="Discussion points..."
                className="min-h-[100px]"
              />
            </div>

            {/* S - Solve */}
            <div className="space-y-2">
              <Label className="text-base font-semibold">
                S - Solve
              </Label>
              <p className="text-sm text-muted-foreground">
                What is the solution? What are the action items?
              </p>
              <Textarea
                value={solve}
                onChange={(e) => setSolve(e.target.value)}
                onBlur={() => {
                  if (solve !== (issue.solve || '')) {
                    handleSave('solve', solve || null);
                  }
                }}
                placeholder="The solution is..."
                className="min-h-[100px]"
              />
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
