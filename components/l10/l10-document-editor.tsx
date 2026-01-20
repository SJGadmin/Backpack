'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { CalendarIcon, Settings } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { toast } from 'sonner';
import { updateL10Document, getScorecardMetrics } from '@/lib/actions/l10';
import type { L10Document, L10ScorecardMetric, UserInfo } from '@/lib/types';
import { L10SegueSection } from './sections/l10-segue-section';
import { L10ScorecardSection } from './sections/l10-scorecard-section';
import { L10RocksSection } from './sections/l10-rocks-section';
import { L10LastWeekTodosSection } from './sections/l10-last-week-todos-section';
import { L10IdsSection } from './sections/l10-ids-section';
import { L10NewTodosSection } from './sections/l10-new-todos-section';
import { L10WrapSection } from './sections/l10-wrap-section';
import { L10ParkingLotSection } from './sections/l10-parking-lot-section';
import { L10MetricsDialog } from './l10-metrics-dialog';
import { L10CarryForwardDialog } from './l10-carry-forward-dialog';

interface L10DocumentEditorProps {
  document: L10Document;
  folderId: string;
  users: UserInfo[];
  onUpdate: () => void;
}

export function L10DocumentEditor({
  document,
  folderId,
  users,
  onUpdate,
}: L10DocumentEditorProps) {
  const [title, setTitle] = useState(document.title);
  const [meetingDate, setMeetingDate] = useState(new Date(document.meetingDate));
  const [weekNumber, setWeekNumber] = useState(document.weekNumber?.toString() || '');
  const [metrics, setMetrics] = useState<L10ScorecardMetric[]>([]);
  const [isMetricsDialogOpen, setIsMetricsDialogOpen] = useState(false);
  const [carryForwardMode, setCarryForwardMode] = useState<'todos' | 'rocks' | null>(null);

  // Update local state when document changes
  useEffect(() => {
    setTitle(document.title);
    setMeetingDate(new Date(document.meetingDate));
    setWeekNumber(document.weekNumber?.toString() || '');
  }, [document]);

  // Load scorecard metrics
  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      const data = await getScorecardMetrics();
      setMetrics(data);
    } catch (error) {
      console.error('Failed to load metrics:', error);
    }
  };

  const handleTitleBlur = async () => {
    if (title !== document.title) {
      try {
        await updateL10Document(document.id, { title });
        onUpdate();
      } catch (error) {
        toast.error('Failed to update title');
        setTitle(document.title);
      }
    }
  };

  const handleDateChange = async (date: Date | undefined) => {
    if (date) {
      setMeetingDate(date);
      try {
        await updateL10Document(document.id, { meetingDate: date });
        onUpdate();
      } catch (error) {
        toast.error('Failed to update date');
        setMeetingDate(new Date(document.meetingDate));
      }
    }
  };

  const handleWeekNumberBlur = async () => {
    const newWeekNumber = weekNumber ? parseInt(weekNumber, 10) : null;
    if (newWeekNumber !== document.weekNumber) {
      try {
        await updateL10Document(document.id, { weekNumber: newWeekNumber });
        onUpdate();
      } catch (error) {
        toast.error('Failed to update week number');
        setWeekNumber(document.weekNumber?.toString() || '');
      }
    }
  };

  return (
    <ScrollArea className="flex-1">
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="bg-card rounded-lg border p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-4">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleTitleBlur}
                className="text-2xl font-bold border-0 px-0 focus-visible:ring-0 bg-transparent"
                placeholder="Meeting Title"
              />
              <div className="flex items-center gap-4 flex-wrap">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="justify-start">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(meetingDate, 'MMMM d, yyyy')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={meetingDate}
                      onSelect={handleDateChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Week</span>
                  <Input
                    type="number"
                    min="1"
                    max="52"
                    value={weekNumber}
                    onChange={(e) => setWeekNumber(e.target.value)}
                    onBlur={handleWeekNumberBlur}
                    className="w-20"
                    placeholder="#"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Segue Section */}
        <L10SegueSection
          documentId={document.id}
          entries={document.segueEntries}
          users={users}
          onUpdate={onUpdate}
        />

        {/* Scorecard Section */}
        <L10ScorecardSection
          documentId={document.id}
          rows={document.scorecardRows}
          metrics={metrics}
          onUpdate={onUpdate}
          onConfigureMetrics={() => setIsMetricsDialogOpen(true)}
        />

        {/* Rocks Section */}
        <L10RocksSection
          documentId={document.id}
          rocks={document.rocks}
          users={users}
          onUpdate={onUpdate}
          onCarryForward={() => setCarryForwardMode('rocks')}
        />

        {/* Last Week To-Dos Section */}
        <L10LastWeekTodosSection
          documentId={document.id}
          todos={document.lastWeekTodos}
          users={users}
          onUpdate={onUpdate}
          onCarryForward={() => setCarryForwardMode('todos')}
        />

        {/* IDS Section */}
        <L10IdsSection
          documentId={document.id}
          issues={document.idsIssues}
          users={users}
          onUpdate={onUpdate}
        />

        {/* New To-Dos Section */}
        <L10NewTodosSection
          documentId={document.id}
          todos={document.newTodos}
          users={users}
          onUpdate={onUpdate}
        />

        {/* Wrap Section */}
        <L10WrapSection
          documentId={document.id}
          feedback={document.wrapFeedback}
          scores={document.wrapScores}
          users={users}
          onUpdate={onUpdate}
        />

        {/* Parking Lot Section */}
        <L10ParkingLotSection
          documentId={document.id}
          items={document.parkingLotItems}
          onUpdate={onUpdate}
        />
      </div>

      {/* Metrics Configuration Dialog */}
      <L10MetricsDialog
        open={isMetricsDialogOpen}
        onOpenChange={setIsMetricsDialogOpen}
        metrics={metrics}
        onSuccess={() => {
          loadMetrics();
          onUpdate();
        }}
      />

      {/* Carry Forward Dialog */}
      <L10CarryForwardDialog
        open={carryForwardMode !== null}
        onOpenChange={(open) => !open && setCarryForwardMode(null)}
        folderId={folderId}
        currentDocumentId={document.id}
        mode={carryForwardMode || 'todos'}
        onSuccess={onUpdate}
      />
    </ScrollArea>
  );
}
