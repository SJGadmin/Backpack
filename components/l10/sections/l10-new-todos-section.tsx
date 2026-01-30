'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import {
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Plus,
  X,
  CalendarIcon,
  Send,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { createNewTodo, updateNewTodo, deleteNewTodo, sendDocumentTodosToSlack } from '@/lib/actions/l10';
import { useNewTodos } from '../use-l10-storage';
import { L10SectionPresence } from '../l10-presence';
import type { L10NewTodo, UserInfo } from '@/lib/types';

interface L10NewTodosSectionProps {
  documentId: string;
  todos: L10NewTodo[];
  users: UserInfo[];
  onUpdate: () => void;
}

export function L10NewTodosSection({
  documentId,
  todos: initialTodos,
  users,
  onUpdate,
}: L10NewTodosSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [newTodoUserId, setNewTodoUserId] = useState<string>('');
  const [newTodoText, setNewTodoText] = useState('');
  const [newTodoDueDate, setNewTodoDueDate] = useState<Date | undefined>();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [isSendingToSlack, setIsSendingToSlack] = useState(false);

  const {
    todos: liveTodos,
    updateTodo: updateLiveTodo,
    addTodo: addLiveTodo,
    addTodos: addLiveTodos,
    deleteTodo: deleteLiveTodo,
    setFocused,
  } = useNewTodos();

  // Sync initialTodos to Liveblocks if they're missing
  useEffect(() => {
    if (liveTodos && initialTodos.length > 0) {
      const liveIds = new Set(liveTodos.map((t) => t.id));
      const missingTodos = initialTodos
        .filter((t) => !liveIds.has(t.id))
        .map((t) => ({
          id: t.id,
          userId: t.userId,
          text: t.text,
          dueDate: t.dueDate ? t.dueDate.toString() : null,
          orderIndex: t.orderIndex,
        }));
      if (missingTodos.length > 0) {
        addLiveTodos(missingTodos);
      }
    }
  }, [initialTodos, liveTodos, addLiveTodos]);

  // Use live todos if available, otherwise fall back to initial
  const todos = liveTodos ?? initialTodos.map((t) => ({
    id: t.id,
    userId: t.userId,
    text: t.text,
    dueDate: t.dueDate ? t.dueDate.toString() : null,
    orderIndex: t.orderIndex,
  }));

  // Group todos by user
  const todosByUser = users.reduce((acc, user) => {
    acc[user.id] = todos.filter((t) => t.userId === user.id);
    return acc;
  }, {} as Record<string, typeof todos>);

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
      dueDate: newTodoDueDate ? newTodoDueDate.toISOString() : null,
      orderIndex: todos.length,
    };

    // Add to Liveblocks immediately
    addLiveTodo(newTodo);
    setNewTodoText('');
    setNewTodoDueDate(undefined);

    try {
      await createNewTodo(
        documentId,
        newTodoUserId,
        newTodoText.trim(),
        newTodoDueDate
      );
      // Remove the temp todo before refresh adds the real one
      deleteLiveTodo(tempId);
      onUpdate(); // Refresh to get the real ID
    } catch (error) {
      toast.error('Failed to add to-do');
      deleteLiveTodo(tempId); // Remove optimistic update on error
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
      await updateNewTodo(todoId, { text: editingText.trim() });
    } catch (error) {
      // Revert on error
      updateLiveTodo(todoId, { text: originalTodo.text });
      toast.error('Failed to update to-do');
    }
  };

  const handleUpdateDueDate = async (todoId: string, date: Date | null) => {
    const originalTodo = todos.find((t) => t.id === todoId);
    if (!originalTodo) return;

    const dateStr = date ? date.toISOString() : null;
    // Update Liveblocks immediately
    updateLiveTodo(todoId, { dueDate: dateStr });

    try {
      await updateNewTodo(todoId, { dueDate: date });
    } catch (error) {
      // Revert on error
      updateLiveTodo(todoId, { dueDate: originalTodo.dueDate });
      toast.error('Failed to update due date');
    }
  };

  const handleDeleteTodo = async (todoId: string) => {
    const originalTodo = todos.find((t) => t.id === todoId);
    // Delete from Liveblocks immediately
    deleteLiveTodo(todoId);

    try {
      await deleteNewTodo(todoId);
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

  const handleSendToSlack = async () => {
    if (todos.length === 0) {
      toast.error('No to-dos to send');
      return;
    }

    setIsSendingToSlack(true);
    try {
      const result = await sendDocumentTodosToSlack(documentId);
      if (result.success) {
        toast.success('To-dos sent to Slack');
      } else {
        toast.error(result.error || 'Failed to send to Slack');
      }
    } catch (error) {
      toast.error('Failed to send to Slack');
    } finally {
      setIsSendingToSlack(false);
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
          <ClipboardList className="h-4 w-4 text-primary" />
          <h2 className="font-semibold">New To-Dos</h2>
          <span className="text-sm text-muted-foreground ml-2">
            (From today)
          </span>
          <L10SectionPresence section="New Todos" />
        </button>
        <div className="pr-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSendToSlack}
            disabled={isSendingToSlack || todos.length === 0}
          >
            <Send className="h-4 w-4 mr-1" />
            {isSendingToSlack ? 'Sending...' : 'Send to Slack'}
          </Button>
        </div>
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
                    <span className="text-muted-foreground">-</span>
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
                        className="flex-1 text-sm cursor-pointer hover:underline"
                      >
                        {todo.text}
                      </span>
                    )}
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`h-7 px-2 ${
                            todo.dueDate ? '' : 'opacity-0 group-hover:opacity-100'
                          }`}
                        >
                          <CalendarIcon className="h-3 w-3 mr-1" />
                          {todo.dueDate
                            ? format(new Date(todo.dueDate), 'MMM d')
                            : 'Due'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="end">
                        <Calendar
                          mode="single"
                          selected={todo.dueDate ? new Date(todo.dueDate) : undefined}
                          onSelect={(date) =>
                            handleUpdateDueDate(todo.id, date || null)
                          }
                          initialFocus
                        />
                        {todo.dueDate && (
                          <div className="p-2 border-t">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full"
                              onClick={() => handleUpdateDueDate(todo.id, null)}
                            >
                              Clear date
                            </Button>
                          </div>
                        )}
                      </PopoverContent>
                    </Popover>
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
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  <CalendarIcon className="h-4 w-4 mr-1" />
                  {newTodoDueDate ? format(newTodoDueDate, 'MMM d') : 'Due'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={newTodoDueDate}
                  onSelect={setNewTodoDueDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
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
