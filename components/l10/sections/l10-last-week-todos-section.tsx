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
import { useLastWeekTodos } from '../use-l10-storage';
import { L10SectionPresence } from '../l10-presence';
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
  todos: initialTodos,
  users,
  onUpdate,
  onCarryForward,
}: L10LastWeekTodosSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [newTodoUserId, setNewTodoUserId] = useState<string>('');
  const [newTodoText, setNewTodoText] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  const {
    todos: liveTodos,
    updateTodo: updateLiveTodo,
    addTodo: addLiveTodo,
    deleteTodo: deleteLiveTodo,
    setFocused,
  } = useLastWeekTodos();

  // Use live todos if available, otherwise fall back to initial
  const todos = liveTodos ?? initialTodos.map((t) => ({
    id: t.id,
    userId: t.userId,
    text: t.text,
    isDone: t.isDone,
    orderIndex: t.orderIndex,
  }));

  // Group todos by user
  const todosByUser = users.reduce((acc, user) => {
    acc[user.id] = todos.filter((t) => t.userId === user.id);
    return acc;
  }, {} as Record<string, typeof todos>);

  // Calculate completion stats
  const completedCount = todos.filter((t) => t.isDone).length;
  const totalCount = todos.length;

  const handleAddTodo = async () => {
    if (!newTodoUserId || !newTodoText.trim()) {
      toast.error('Please select a user and enter a to-do');
      return;
    }

    // Generate a temporary ID for optimistic update
    const tempId = `temp-${Date.now()}`;
    const newTodo = {
      id: tempId,
      userId: newTodoUserId,
      text: newTodoText.trim(),
      isDone: false,
      orderIndex: todos.length,
    };

    // Add to Liveblocks immediately
    addLiveTodo(newTodo);
    setNewTodoText('');

    try {
      await createLastWeekTodo(documentId, newTodoUserId, newTodoText.trim());
      onUpdate(); // Refresh to get the real ID
    } catch (error) {
      toast.error('Failed to add to-do');
      deleteLiveTodo(tempId); // Remove optimistic update on error
    }
  };

  const handleToggleDone = async (todo: typeof todos[0]) => {
    const newStatus = !todo.isDone;
    // Update Liveblocks immediately
    updateLiveTodo(todo.id, { isDone: newStatus });

    try {
      await updateLastWeekTodo(todo.id, { isDone: newStatus });
    } catch (error) {
      // Revert on error
      updateLiveTodo(todo.id, { isDone: todo.isDone });
      toast.error('Failed to update to-do');
    }
  };

  const handleSaveText = async (todoId: string) => {
    if (!editingText.trim()) {
      setEditingId(null);
      return;
    }

    const originalTodo = todos.find((t) => t.id === todoId);
    if (!originalTodo || originalTodo.text === editingText.trim()) {
      setEditingId(null);
      return;
    }

    // Update Liveblocks immediately
    updateLiveTodo(todoId, { text: editingText.trim() });
    setEditingId(null);

    try {
      await updateLastWeekTodo(todoId, { text: editingText.trim() });
    } catch (error) {
      // Revert on error
      updateLiveTodo(todoId, { text: originalTodo.text });
      toast.error('Failed to update to-do');
    }
  };

  const handleDeleteTodo = async (todoId: string) => {
    const originalTodo = todos.find((t) => t.id === todoId);
    // Delete from Liveblocks immediately
    deleteLiveTodo(todoId);

    try {
      await deleteLastWeekTodo(todoId);
    } catch (error) {
      // Revert on error
      if (originalTodo) {
        addLiveTodo(originalTodo);
      }
      toast.error('Failed to delete to-do');
    }
  };

  const handleFocus = () => setFocused(true);
  const handleBlurFocus = () => setFocused(false);

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
          <L10SectionPresence section="Last Week Todos" />
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
                        onFocus={handleFocus}
                        onBlur={() => {
                          handleSaveText(todo.id);
                          handleBlurFocus();
                        }}
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
              onFocus={handleFocus}
              onBlur={handleBlurFocus}
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
