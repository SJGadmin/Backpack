'use client';

import { useState, useCallback, useEffect } from 'react';
import { ChevronDown, ChevronRight, BarChart3, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { updateScorecardRow } from '@/lib/actions/l10';
import { useScorecardRows } from '../use-l10-storage';
import { L10SectionPresence } from '../l10-presence';
import type { L10ScorecardRow, L10ScorecardMetric } from '@/lib/types';

interface L10ScorecardSectionProps {
  documentId: string;
  rows: L10ScorecardRow[];
  metrics: L10ScorecardMetric[];
  onUpdate: () => void;
  onConfigureMetrics: () => void;
}

export function L10ScorecardSection({
  documentId,
  rows: initialRows,
  metrics,
  onConfigureMetrics,
}: L10ScorecardSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const { rows: liveRows, updateRowByMetricId, addRows, setFocused } = useScorecardRows();

  // Sync initialRows to Liveblocks if they're missing
  useEffect(() => {
    if (liveRows && initialRows.length > 0) {
      const liveIds = new Set(liveRows.map((r) => r.id));
      const missingRows = initialRows
        .filter((r) => !liveIds.has(r.id))
        .map((r) => ({
          id: r.id,
          metricId: r.metricId,
          value: r.value,
        }));
      if (missingRows.length > 0) {
        addRows(missingRows);
      }
    }
  }, [initialRows, liveRows, addRows]);

  // Use live rows if available, otherwise fall back to initial
  const rows = liveRows ?? initialRows.map((r) => ({
    id: r.id,
    metricId: r.metricId,
    value: r.value,
  }));

  const getRowValue = useCallback(
    (metricId: string) => {
      const row = rows?.find((r) => r.metricId === metricId);
      return row?.value?.toString() ?? '';
    },
    [rows]
  );

  const handleChange = (metricId: string, value: string) => {
    const numValue = value ? parseFloat(value) : null;
    // Update Liveblocks storage immediately for real-time sync
    updateRowByMetricId(metricId, numValue);
  };

  const handleBlur = async (metricId: string) => {
    const valueStr = getRowValue(metricId);
    const numValue = valueStr ? parseFloat(valueStr) : null;
    // Also persist to database
    try {
      await updateScorecardRow(documentId, metricId, numValue);
    } catch (error) {
      console.error('Failed to persist scorecard row:', error);
    }
  };

  const handleFocus = () => {
    setFocused(true);
  };

  const handleBlurFocus = () => {
    setFocused(false);
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
          <BarChart3 className="h-4 w-4 text-primary" />
          <h2 className="font-semibold">Scorecard</h2>
          <span className="text-sm text-muted-foreground ml-2">
            (Just the numbers. No explanation.)
          </span>
          <L10SectionPresence section="Scorecard" />
        </button>
        <Button
          variant="ghost"
          size="icon-sm"
          className="mr-2"
          onClick={onConfigureMetrics}
        >
          <Settings className="h-4 w-4" />
        </Button>
      </div>

      {isExpanded && (
        <div className="px-4 pb-4">
          {metrics.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No metrics configured.{' '}
              <button
                onClick={onConfigureMetrics}
                className="text-primary hover:underline"
              >
                Add some metrics
              </button>
            </p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {metrics.map((metric) => (
                <div key={metric.id} className="space-y-1">
                  <label className="text-sm font-medium">{metric.name}</label>
                  <Input
                    type="number"
                    value={getRowValue(metric.id)}
                    onChange={(e) => handleChange(metric.id, e.target.value)}
                    onFocus={handleFocus}
                    onBlur={() => {
                      handleBlur(metric.id);
                      handleBlurFocus();
                    }}
                    placeholder="0"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
