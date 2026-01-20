'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronRight, BarChart3, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { updateScorecardRow } from '@/lib/actions/l10';
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
  rows,
  metrics,
  onConfigureMetrics,
}: L10ScorecardSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [localValues, setLocalValues] = useState<Record<string, string>>({});
  const initializedRef = useRef(false);
  const pendingSavesRef = useRef<Set<string>>(new Set());

  // Initialize local state from props
  useEffect(() => {
    if (!initializedRef.current || pendingSavesRef.current.size === 0) {
      const valuesMap: Record<string, string> = {};
      rows.forEach((r) => {
        if (!pendingSavesRef.current.has(r.metricId)) {
          valuesMap[r.metricId] = r.value?.toString() || '';
        }
      });
      setLocalValues((prev) => ({
        ...prev,
        ...valuesMap,
      }));
      initializedRef.current = true;
    }
  }, [rows]);

  // Reset when document changes
  useEffect(() => {
    initializedRef.current = false;
    pendingSavesRef.current.clear();
    const valuesMap: Record<string, string> = {};
    rows.forEach((r) => {
      valuesMap[r.metricId] = r.value?.toString() || '';
    });
    setLocalValues(valuesMap);
  }, [documentId]);

  const handleChange = (metricId: string, value: string) => {
    setLocalValues((prev) => ({ ...prev, [metricId]: value }));
  };

  const handleBlur = async (metricId: string) => {
    const valueStr = localValues[metricId] ?? '';
    const existingRow = rows.find((r) => r.metricId === metricId);
    const newValue = valueStr ? parseFloat(valueStr) : null;

    if (existingRow?.value === newValue) return;

    pendingSavesRef.current.add(metricId);

    try {
      await updateScorecardRow(documentId, metricId, newValue);
    } catch (error) {
      console.error('Failed to update scorecard row:', error);
    } finally {
      setTimeout(() => {
        pendingSavesRef.current.delete(metricId);
      }, 1000);
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
          <BarChart3 className="h-4 w-4 text-primary" />
          <h2 className="font-semibold">Scorecard</h2>
          <span className="text-sm text-muted-foreground ml-2">
            (Just the numbers. No explanation.)
          </span>
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
                    value={localValues[metric.id] ?? ''}
                    onChange={(e) => handleChange(metric.id, e.target.value)}
                    onBlur={() => handleBlur(metric.id)}
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
