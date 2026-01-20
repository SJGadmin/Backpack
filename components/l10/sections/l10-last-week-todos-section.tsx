'use client';

import { useState, useEffect, useRef } from 'react';
import {
  ChevronDown,
  ChevronRight,
  ListTodo,
  Plus,
  X,
  Check,
  Ban,
  ArrowRightLeft,
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
  onCarryForward?: () => void;
}

export function L10LastWeekTodosSection({
  documentId,
  todos,
  users,
  onUpdate,
  onCarryForward,
}: L10LastWeekTodosSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [newTodoUserId, setNewTodoUserId] = useState<string>('');
  const [newTodoText, setNewTodoText] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [localTodos, setLocalTodos] = useState<L10LastWeekTodo[]>(todos);
  const pendingSavesRef = useRef<Set<string>>(new Set());

  // Sync local state with props when not pending saves
  useEffect(() => {
    if (pendingSavesRef.current.size === 0) {
      setLocalTodos(todos);
    } else {
      setLocalTodos((prev) =>
        prev.map((t) =>
          pendingSavesRef.current.has(t.id)
            ? t
            : todos.find((pt) => pt.id === t.id) || t
        )
      );
    }
  }, [todos]);

  // Group todos by user
  const todosByUser = users.reduce((acc, user) => {
    acc[user.id] = localTodos.filter((t) => t.userId === user.id);
    return acc;
  }, {} as Record<string, L10LastWeekTodo[]>);

  // Calculate completion stats
  const completedCount = localTodos.filter((t) => t.isDone).length;
  const totalCount = localTodos.length;

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
    // Optimistic update
    const newStatus = !todo.isDone;
    setLocalTodos((prev) =>
      prev.map((t) => (t.id === todo.id ? { ...t, isDone: newStatus } : t))
    );
    pendingSavesRef.current.add(todo.id);

    try {
      await updateLastWeekTodo(todo.id, { isDone: newStatus });
    } catch (error) {
      // Revert on error
      setLocalTodos((prev) =>
        prev.map((t) => (t.id === todo.id ? { ...t, isDone: todo.isDone } : t))
      );
      toast.error('Failed to update to-do');
    } finally {
      setTimeout(() => {
        pendingSavesRef.current.delete(todo.id);
      }, 1000);
    }
  };

  const handleSaveText = async (todoId: string) => {
    if (!editingText.trim()) {
      setEditingId(null);
      return;
    }

    const originalTodo = localTodos.find((t) => t.id === todoId);
    if (!originalTodo || originalTodo.text === editingText.trim()) {
      setEditingId(null);
      return;
    }

    // Optimistic update
    setLocalTodos((prev) =>
      prev.map((t) => (t.id === todoId ? { ...t, text: editingText.trim() } : t))
    );
    pendingSavesRef.current.add(todoId);
    setEditingId(null);

    try {
      await updateLastWeekTodo(todoId, { text: editingText.trim() });
    } catch (error) {
      // Revert on error
      setLocalTodos((prev) =>
        prev.map((t) => (t.id === todoId ? { ...t, text: originalTodo.text } : t))
      );
      toast.error('Failed to update to-do');
    } finally {
      setTimeout(() => {
        pendingSavesRef.current.delete(todoId);
      }, 1000);
    }
  };

  const handleDeleteTodo = async (todoId: string) => {
    // Optimistic update
    const originalTodos = [...localTodos];
    setLocalTodos((prev) => prev.filter((t) => t.id !== todoId));

    try {
      await deleteLastWeekTodo(todoId);
    } catch (error) {
      // Revert on error
      setLocalTodos(originalTodos);
      toast.error('Failed to delete to-do');
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
        {onCarryForward && (
          <Button
            variant="ghost"
            size="sm"
            className="mr-2"
            onClick={onCarryForward}
            title="Carry forward from last meeting"
          >
            <ArrowRightLeft className="h-4 w-4" />
          </Button>
        )}
      </div>

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
