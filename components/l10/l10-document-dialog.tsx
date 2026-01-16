'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
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
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { toast } from 'sonner';
import { createL10Document } from '@/lib/actions/l10';

interface L10DocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folderId: string;
  onSuccess: () => void;
}

export function L10DocumentDialog({
  open,
  onOpenChange,
  folderId,
  onSuccess,
}: L10DocumentDialogProps) {
  const [title, setTitle] = useState('L-10 - Weekly Meeting');
  const [meetingDate, setMeetingDate] = useState<Date>(new Date());
  const [weekNumber, setWeekNumber] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    setIsSubmitting(true);
    try {
      await createL10Document(
        folderId,
        title.trim(),
        meetingDate,
        weekNumber ? parseInt(weekNumber, 10) : undefined
      );
      toast.success('Meeting created');
      // Reset form
      setTitle('L-10 - Weekly Meeting');
      setMeetingDate(new Date());
      setWeekNumber('');
      onSuccess();
    } catch (error) {
      toast.error('Failed to create meeting');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Meeting</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="doc-title">Title</Label>
            <Input
              id="doc-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="L-10 - Weekly Meeting"
            />
          </div>

          <div className="space-y-2">
            <Label>Meeting Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(meetingDate, 'PPP')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={meetingDate}
                  onSelect={(date) => date && setMeetingDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="week-number">Week Number (optional)</Label>
            <Input
              id="week-number"
              type="number"
              min="1"
              max="52"
              value={weekNumber}
              onChange={(e) => setWeekNumber(e.target.value)}
              placeholder="e.g., 1"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
