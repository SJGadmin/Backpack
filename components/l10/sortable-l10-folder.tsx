'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Folder, GripVertical } from 'lucide-react';
import type { L10FolderWithCount } from '@/lib/types';

interface SortableL10FolderProps {
  folder: L10FolderWithCount;
  isSelected: boolean;
  onClick: () => void;
}

export function SortableL10Folder({
  folder,
  isSelected,
  onClick,
}: SortableL10FolderProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: folder.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
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
        className="flex-1 flex items-center gap-2 text-left"
      >
        <Folder className="h-4 w-4 flex-shrink-0" />
        <span className="flex-1 truncate">{folder.name}</span>
        <span
          className={`text-xs ${
            isSelected
              ? 'text-primary-foreground/70'
              : 'text-muted-foreground'
          }`}
        >
          {folder._count.documents}
        </span>
      </button>
    </div>
  );
}
