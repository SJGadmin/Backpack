'use client';

import { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  ListTodo,
  Plus,
  X,
  Check,
  Ban,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  createLastWeekTodo,
  updateLastWeekTodo,
  deleteLastWeekTodo,
} from '@/lib/actions/l10';
import type { L10LastWeekTodo, UserInfo } from '@/lib/types';

interface L10LastWeekTodosSectionProps {
  documentId: string;
  todos: L10LastWeekTodo[];
  users: UserInfo[];
  onUpdate: () => void;
}

export function L10LastWeekTodosSection({
  documentId,
  todos,
  users,
  onUpdate,
}: L10LastWeekTodosSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [newTodoUserId, setNewTodoUserId] = useState<string>('');
  const [newTodoText, setNewTodoText] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  // Group todos by user
  const todosByUser = users.reduce((acc, user) => {
    acc[user.id] = todos.filter((t) => t.userId === user.id);
    return acc;
  }, {} as Record<string, L10LastWeekTodo[]>);

  // Calculate completion stats
  const completedCount = todos.filter((t) => t.isDone).length;
  const totalCount = todos.length;

  const handleAddTodo = async () => {
    if (!newTodoUserId || !newTodoText.trim()) {
      toast.error('Please select a user and enter a to-do');
      return;
    }

    try {
      await createLastWeekTodo(documentId, newTodoUserId, newTodoText.trim());
      setNewTodoText('');
      onUpdate();
    } catch (error) {
      toast.error('Failed to add to-do');
    }
  };

  const handleToggleDone = async (todo: L10LastWeekTodo) => {
    try {
      await updateLastWeekTodo(todo.id, { isDone: !todo.isDone });
      onUpdate();
    } catch (error) {
      toast.error('Failed to update to-do');
    }
  };

  const handleSaveText = async (todoId: string) => {
    if (!editingText.trim()) {
      setEditingId(null);
      return;
    }

    try {
      await updateLastWeekTodo(todoId, { text: editingText.trim() });
      setEditingId(null);
      onUpdate();
    } catch (error) {
      toast.error('Failed to update to-do');
    }
  };

  const handleDeleteTodo = async (todoId: string) => {
    try {
      await deleteLastWeekTodo(todoId);
      onUpdate();
    } catch (error) {
      toast.error('Failed to delete to-do');
    }
  };

  return (
    <div className="bg-card rounded-lg border">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-2 p-4 hover:bg-accent/50 transition-colors"
      >
        {isExpanded ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
        <ListTodo className="h-4 w-4 text-primary" />
        <h2 className="font-semibold">Last Week To-Dos</h2>
        <div className="flex items-center gap-4 ml-auto">
          <span className="flex items-center gap-1 text-sm">
            <Check className="h-3 w-3 text-green-500" />
            Done
          </span>
          <span className="flex items-center gap-1 text-sm">
            <Ban className="h-3 w-3 text-red-500" />
            Not Done
          </span>
          {totalCount > 0 && (
            <span className="text-sm text-muted-foreground">
              {completedCount}/{totalCount} done
            </span>
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-4">
          {users.map((user) => (
            <div key={user.id} className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground">
                {user.name}
              </h3>
              <div className="space-y-1">
                {todosByUser[user.id]?.length === 0 && (
                  <p className="text-sm text-muted-foreground italic">
                    No to-dos
                  </p>
                )}
                {todosByUser[user.id]?.map((todo) => (
                  <div
                    key={todo.id}
                    className="flex items-center gap-2 group py-1"
                  >
                    <Checkbox
                      checked={todo.isDone}
                      onCheckedChange={() => handleToggleDone(todo)}
                    />
                    {editingId === todo.id ? (
                      <Input
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        onBlur={() => handleSaveText(todo.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveText(todo.id);
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                        className="flex-1 h-7 text-sm"
                        autoFocus
                      />
                    ) : (
                      <span
                        onClick={() => {
                          setEditingId(todo.id);
                          setEditingText(todo.text);
                        }}
                        className={`flex-1 text-sm cursor-pointer hover:underline ${
                          todo.isDone
                            ? 'line-through text-muted-foreground'
                            : ''
                        }`}
                      >
                        {todo.text}
                      </span>
                    )}
                    <button
                      onClick={() => handleDeleteTodo(todo.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Add new to-do */}
          <div className="flex items-center gap-2 pt-2 border-t">
            <Select value={newTodoUserId} onValueChange={setNewTodoUserId}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="User" />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              value={newTodoText}
              onChange={(e) => setNewTodoText(e.target.value)}
              placeholder="To-do item"
              className="flex-1"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddTodo();
              }}
            />
            <Button size="sm" onClick={handleAddTodo}>
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
