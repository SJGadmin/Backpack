'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card as CardType, Task } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, MessageSquare, Paperclip, CheckSquare, AlertCircle } from 'lucide-react';
import { format, isPast, isToday } from 'date-fns';

interface KanbanCardProps {
  card: CardType;
  onClick: () => void;
}

export function KanbanCard({ card, onClick }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const incompleteTasks = card.tasks.filter((t) => !t.completed);
  const overdueTasks = incompleteTasks.filter(
    (t) => t.dueDate && isPast(new Date(t.dueDate)) && !isToday(new Date(t.dueDate))
  );

  const isOverdue = card.dueDate && isPast(new Date(card.dueDate)) && !isToday(new Date(card.dueDate));

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="p-3 cursor-pointer hover:shadow-md hover:border-primary/50 transition-all bg-card text-card-foreground"
      onClick={onClick}
    >
      <div className="space-y-2">
        <h3 className="font-medium text-sm line-clamp-2">{card.title}</h3>

        <div className="flex flex-wrap gap-2 items-center text-xs text-muted-foreground">
          {card.dueDate && (
            <Badge
              variant={isOverdue ? 'destructive' : 'secondary'}
              className="flex items-center gap-1"
            >
              {isOverdue && <AlertCircle className="h-3 w-3" />}
              <Calendar className="h-3 w-3" />
              {format(new Date(card.dueDate), 'MMM d')}
            </Badge>
          )}

          {incompleteTasks.length > 0 && (
            <span className="flex items-center gap-1">
              <CheckSquare className="h-3 w-3" />
              {card.tasks.filter((t) => t.completed).length}/{card.tasks.length}
              {overdueTasks.length > 0 && (
                <AlertCircle className="h-3 w-3 text-red-500 ml-1" />
              )}
            </span>
          )}

          {card.comments.length > 0 && (
            <span className="flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              {card.comments.length}
            </span>
          )}

          {card.attachments.length > 0 && (
            <span className="flex items-center gap-1">
              <Paperclip className="h-3 w-3" />
              {card.attachments.length}
            </span>
          )}
        </div>

        {incompleteTasks.some((t) => t.assignedTo) && (
          <div className="flex -space-x-2">
            {(Array.from(
              new Set(
                incompleteTasks
                  .filter((t) => t.assignedTo)
                  .map((t) => t.assignedTo!.name)
              )
            ) as string[])
              .slice(0, 3)
              .map((name) => (
                <div
                  key={name}
                  className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium border-2 border-card"
                >
                  {name.charAt(0)}
                </div>
              ))}
          </div>
        )}
      </div>
    </Card>
  );
}
