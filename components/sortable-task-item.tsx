'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Trash2, Calendar as CalendarIcon, AlertCircle, GripVertical } from 'lucide-react';
import { format, isPast, isToday } from 'date-fns';
import { useState } from 'react';

interface SortableTaskItemProps {
  task: {
    id: string;
    text: string;
    completed: boolean;
    dueDate: Date | null;
    assignedToId: string | null;
    assignedTo?: { name: string; id: string; email: string } | null;
  };
  users: Array<{ id: string; name: string; email: string }>;
  onToggle: (task: { id: string; completed: boolean }) => void;
  onUpdateAssignment: (taskId: string, userId: string | null) => void;
  onUpdateDueDate: (taskId: string, date: Date | undefined) => void;
  onUpdateText: (taskId: string, text: string) => void;
  onDelete: (taskId: string) => void;
}

export function SortableTaskItem({
  task,
  users,
  onToggle,
  onUpdateAssignment,
  onUpdateDueDate,
  onUpdateText,
  onDelete,
}: SortableTaskItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(task.text);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const taskOverdue =
    task.dueDate &&
    !task.completed &&
    isPast(new Date(task.dueDate)) &&
    !isToday(new Date(task.dueDate));

  const handleBlur = () => {
    setIsEditing(false);
    if (editText !== task.text && editText.trim()) {
      onUpdateText(task.id, editText);
    } else {
      setEditText(task.text);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-start gap-2 p-2 rounded-md border ${
        taskOverdue ? 'border-red-500/50' : ''
      }`}
    >
      <div
        {...attributes}
        {...listeners}
        className="mt-1 cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>
      <Checkbox
        checked={task.completed}
        onCheckedChange={() => onToggle(task)}
        className="mt-1"
      />
      <div className="flex-1 min-w-0 space-y-2">
        {isEditing ? (
          <Input
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleBlur();
              if (e.key === 'Escape') {
                setEditText(task.text);
                setIsEditing(false);
              }
            }}
            autoFocus
            className="h-8"
          />
        ) : (
          <p
            className={`cursor-pointer break-words ${
              task.completed
                ? 'line-through text-muted-foreground'
                : taskOverdue
                ? 'text-red-600 dark:text-red-400'
                : ''
            }`}
            onClick={() => setIsEditing(true)}
          >
            {task.text}
          </p>
        )}
        <div className="flex items-center gap-2">
          <Select
            value={task.assignedToId || 'unassigned'}
            onValueChange={(value) =>
              onUpdateAssignment(task.id, value === 'unassigned' ? null : value)
            }
          >
            <SelectTrigger className="w-32 h-8">
              <SelectValue />
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
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={`h-8 ${taskOverdue ? 'border-red-500 text-red-600' : ''}`}
              >
                {taskOverdue && <AlertCircle className="mr-1 h-3 w-3" />}
                <CalendarIcon className="mr-1 h-3 w-3" />
                {task.dueDate ? format(new Date(task.dueDate), 'MMM d') : 'Due'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={task.dueDate ? new Date(task.dueDate) : undefined}
                onSelect={(date) => onUpdateDueDate(task.id, date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onDelete(task.id)}
        className="h-8 w-8 p-0"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
