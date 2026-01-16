'use client';

import { useState } from 'react';
import { Plus, X, GripVertical } from 'lucide-react';
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
import {
  createScorecardMetric,
  updateScorecardMetric,
  deleteScorecardMetric,
} from '@/lib/actions/l10';
import type { L10ScorecardMetric } from '@/lib/types';

interface L10MetricsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  metrics: L10ScorecardMetric[];
  onSuccess: () => void;
}

export function L10MetricsDialog({
  open,
  onOpenChange,
  metrics,
  onSuccess,
}: L10MetricsDialogProps) {
  const [newMetricName, setNewMetricName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddMetric = async () => {
    if (!newMetricName.trim()) {
      toast.error('Please enter a metric name');
      return;
    }

    setIsSubmitting(true);
    try {
      await createScorecardMetric(newMetricName.trim());
      setNewMetricName('');
      onSuccess();
      toast.success('Metric added');
    } catch (error) {
      toast.error('Failed to add metric');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveMetric = async (metricId: string) => {
    if (!editingName.trim()) {
      setEditingId(null);
      return;
    }

    setIsSubmitting(true);
    try {
      await updateScorecardMetric(metricId, { name: editingName.trim() });
      setEditingId(null);
      onSuccess();
    } catch (error) {
      toast.error('Failed to update metric');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMetric = async (metricId: string) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this metric? This will remove it from all meetings.'
    );
    if (!confirmed) return;

    setIsSubmitting(true);
    try {
      await deleteScorecardMetric(metricId);
      onSuccess();
      toast.success('Metric deleted');
    } catch (error) {
      toast.error('Failed to delete metric');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Configure Scorecard Metrics</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            {metrics.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No metrics configured yet
              </p>
            ) : (
              metrics.map((metric) => (
                <div
                  key={metric.id}
                  className="flex items-center gap-2 group"
                >
                  <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                  {editingId === metric.id ? (
                    <Input
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onBlur={() => handleSaveMetric(metric.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveMetric(metric.id);
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      className="flex-1"
                      autoFocus
                      disabled={isSubmitting}
                    />
                  ) : (
                    <span
                      onClick={() => {
                        setEditingId(metric.id);
                        setEditingName(metric.name);
                      }}
                      className="flex-1 text-sm cursor-pointer hover:underline py-2"
                    >
                      {metric.name}
                    </span>
                  )}
                  <button
                    onClick={() => handleDeleteMetric(metric.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    disabled={isSubmitting}
                  >
                    <X className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Add new metric */}
          <div className="flex items-center gap-2 pt-2 border-t">
            <Input
              value={newMetricName}
              onChange={(e) => setNewMetricName(e.target.value)}
              placeholder="New metric name"
              className="flex-1"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddMetric();
              }}
              disabled={isSubmitting}
            />
            <Button
              size="sm"
              onClick={handleAddMetric}
              disabled={isSubmitting}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
