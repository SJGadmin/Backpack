'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Column as ColumnType, Card as CardType } from '@/lib/types';
import { KanbanCard } from './kanban-card';
import { Button } from '@/components/ui/button';
import { Plus, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface KanbanColumnProps {
  column: ColumnType;
  onCardClick: (card: CardType) => void;
  onAddCard: (columnId: string) => void;
  onEditColumn: (column: ColumnType) => void;
  onDeleteColumn: (columnId: string) => void;
}

export function KanbanColumn({
  column,
  onCardClick,
  onAddCard,
  onEditColumn,
  onDeleteColumn,
}: KanbanColumnProps) {
  const { setNodeRef } = useDroppable({
    id: column.id,
  });

  return (
    <div className="flex-shrink-0 w-80 flex flex-col max-h-full">
      <div className="flex items-center justify-between p-3 bg-slate-100 dark:bg-slate-800 rounded-t-lg">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-sm">{column.name}</h2>
          <span className="text-xs text-muted-foreground bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-full">
            {column.cards.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onAddCard(column.id)}
            className="h-7 w-7 p-0 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEditColumn(column)}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit column
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDeleteColumn(column.id)}
                className="text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete column
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div
        ref={setNodeRef}
        className="flex-1 overflow-y-auto p-3 space-y-2 bg-slate-50 dark:bg-slate-900/50 rounded-b-lg"
      >
        <SortableContext
          items={column.cards.map((c: CardType) => c.id)}
          strategy={verticalListSortingStrategy}
        >
          {column.cards.map((card: CardType) => (
            <KanbanCard
              key={card.id}
              card={card}
              onClick={() => onCardClick(card)}
            />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}
