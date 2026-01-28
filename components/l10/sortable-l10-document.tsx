'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { format } from 'date-fns';
import { FileText, ChevronRight, GripVertical, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { L10DocumentSummary } from '@/lib/types';

interface SortableL10DocumentProps {
  document: L10DocumentSummary;
  isSelected: boolean;
  onClick: () => void;
  onDelete?: (id: string) => void;
}

export function SortableL10Document({
  document,
  isSelected,
  onClick,
  onDelete,
}: SortableL10DocumentProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: document.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors group ${
        isSelected
          ? 'bg-primary text-primary-foreground'
          : 'hover:bg-accent'
      }`}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing"
      >
        <GripVertical className={`h-4 w-4 ${isSelected ? 'text-primary-foreground/70' : 'text-muted-foreground'}`} />
      </div>
      <button
        onClick={onClick}
        className="flex-1 flex items-center gap-2 text-left min-w-0"
      >
        <FileText className="h-4 w-4 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="truncate font-medium">
            {document.weekNumber ? `Week ${document.weekNumber}` : format(new Date(document.meetingDate), 'MMM d')}
          </p>
          <p
            className={`text-xs truncate ${
              isSelected
                ? 'text-primary-foreground/70'
                : 'text-muted-foreground'
            }`}
          >
            {format(new Date(document.meetingDate), 'MMM d, yyyy')}
          </p>
        </div>
        <ChevronRight className="h-4 w-4 flex-shrink-0 opacity-50" />
      </button>
      {onDelete && (
        <Button
          variant="ghost"
          size="icon-sm"
          className={`opacity-0 group-hover:opacity-100 transition-opacity ${
            isSelected ? 'hover:bg-primary-foreground/20' : 'hover:bg-destructive/20'
          }`}
          onClick={(e) => {
            e.stopPropagation();
            if (confirm('Delete this meeting? This cannot be undone.')) {
              onDelete(document.id);
            }
          }}
        >
          <Trash2 className={`h-3 w-3 ${isSelected ? 'text-primary-foreground' : 'text-destructive'}`} />
        </Button>
      )}
    </div>
  );
}
