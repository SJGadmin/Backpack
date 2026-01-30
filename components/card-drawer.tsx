'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card as CardType, Task, Comment, Attachment, Link } from '@/lib/types';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Calendar as CalendarIcon,
  Plus,
  Trash2,
  Paperclip,
  Download,
  X,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { format, isPast, isToday } from 'date-fns';
import { updateCard, deleteCard } from '@/lib/actions/cards';
import { createTask, updateTask, deleteTask, reorderTasks } from '@/lib/actions/tasks';
import { createComment, deleteComment } from '@/lib/actions/comments';
import { createAttachment, deleteAttachment } from '@/lib/actions/attachments';
import { createLink, deleteLink } from '@/lib/actions/links';
import { toast } from 'sonner';
import { SortableTaskItem } from './sortable-task-item';

interface CardDrawerProps {
  card: CardType | null;
  isOpen: boolean;
  onClose: () => void;
  users: Array<{ id: string; name: string; email: string }>;
  onUpdate?: () => void;
}

export function CardDrawer({ card, isOpen, onClose, users, onUpdate }: CardDrawerProps) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [newTaskText, setNewTaskText] = useState('');
  const [newComment, setNewComment] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [localTasks, setLocalTasks] = useState<any[]>([]);
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [newLinkTitle, setNewLinkTitle] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (card) {
      setTitle(card.title);
      setLocalTasks(card.tasks);

      // Parse description - if it's JSON, extract the text
      let desc = card.description || '';
      try {
        const json = JSON.parse(desc);
        // Extract text from TipTap JSON format
        if (json.type === 'doc' && json.content) {
          desc = json.content
            .map((node: any) => {
              if (node.content) {
                return node.content.map((n: any) => n.text || '').join('');
              }
              return '';
            })
            .join('\n');
        }
      } catch {
        // Not JSON, use as-is
      }

      setDescription(desc);
      setDueDate(card.dueDate ? new Date(card.dueDate) : undefined);
    }
  }, [card]);

  if (!card) return null;

  const handleUpdateTitle = async () => {
    if (title !== card.title) {
      await updateCard(card.id, { title });
      toast.success('Title updated');
    }
  };

  const handleUpdateDescription = async () => {
    if (description !== card.description) {
      await updateCard(card.id, { description });
      onUpdate?.();
      toast.success('Description updated');
    }
  };

  const handleUpdateDueDate = async (date: Date | undefined) => {
    setDueDate(date);
    await updateCard(card.id, { dueDate: date || null });
    toast.success(date ? 'Due date set' : 'Due date removed');
  };

  const handleAddTask = async () => {
    if (!newTaskText.trim()) return;
    await createTask(card.id, newTaskText);
    setNewTaskText('');
    onUpdate?.();
    toast.success('Task added');
  };

  const handleToggleTask = async (task: { id: string; completed: boolean }) => {
    // Optimistic update
    setLocalTasks(prev =>
      prev.map(t => t.id === task.id ? { ...t, completed: !t.completed } : t)
    );
    // Save to database in background
    updateTask(task.id, { completed: !task.completed });
  };

  const handleUpdateTaskAssignment = async (taskId: string, userId: string | null) => {
    // Optimistic update
    setLocalTasks(prev =>
      prev.map(t => t.id === taskId ? { ...t, assignedToId: userId } : t)
    );
    // Save to database in background
    updateTask(taskId, { assignedToId: userId });
    toast.success('Task assignment updated');
  };

  const handleUpdateTaskDueDate = async (taskId: string, date: Date | undefined) => {
    // Optimistic update
    setLocalTasks(prev =>
      prev.map(t => t.id === taskId ? { ...t, dueDate: date || null } : t)
    );
    // Save to database in background
    updateTask(taskId, { dueDate: date || null });
    toast.success('Task due date updated');
  };

  const handleUpdateTaskText = async (taskId: string, text: string) => {
    // Optimistic update
    setLocalTasks(prev =>
      prev.map(t => t.id === taskId ? { ...t, text } : t)
    );
    // Save to database in background
    updateTask(taskId, { text });
    toast.success('Task updated');
  };

  const handleDeleteTask = async (taskId: string) => {
    // Optimistic update
    setLocalTasks(prev => prev.filter(t => t.id !== taskId));
    // Save to database in background
    deleteTask(taskId);
    toast.success('Task deleted');
  };

  const handleTaskDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = localTasks.findIndex((t) => t.id === active.id);
      const newIndex = localTasks.findIndex((t) => t.id === over.id);

      // Optimistic update
      const newTasks = arrayMove(localTasks, oldIndex, newIndex);
      setLocalTasks(newTasks);

      // Save to database in background
      const taskIds = newTasks.map((t) => t.id);
      reorderTasks(card.id, taskIds);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    await createComment(card.id, newComment);
    setNewComment('');
    onUpdate?.();
    toast.success('Comment added');
  };

  const handleDeleteComment = async (commentId: string) => {
    await deleteComment(commentId);
    onUpdate?.();
    toast.success('Comment deleted');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append('file', file);
        await createAttachment(card.id, formData);
      }
      onUpdate?.();
      toast.success('Files uploaded');
    } catch (error) {
      toast.error('Failed to upload files');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    await deleteAttachment(attachmentId);
    onUpdate?.();
    toast.success('Attachment deleted');
  };

  const handleAddLink = async () => {
    if (!newLinkUrl.trim()) return;
    await createLink(card.id, newLinkUrl, newLinkTitle || undefined);
    setNewLinkUrl('');
    setNewLinkTitle('');
    onUpdate?.();
    toast.success('Link added');
  };

  const handleDeleteLink = async (linkId: string) => {
    await deleteLink(linkId);
    onUpdate?.();
    toast.success('Link deleted');
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this card?')) {
      await deleteCard(card.id);
      toast.success('Card deleted');
      onClose();
    }
  };

  const isOverdue = dueDate && isPast(dueDate) && !isToday(dueDate);
  const incompleteTasks = localTasks.filter((t) => !t.completed);
  const overdueTasks = incompleteTasks.filter(
    (t) => t.dueDate && isPast(new Date(t.dueDate)) && !isToday(new Date(t.dueDate))
  );

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-2xl p-0">
        <ScrollArea className="h-full">
          <div className="p-6 space-y-6">
            <SheetHeader>
              <SheetTitle className="sr-only">Card Details</SheetTitle>
              <div className="flex items-start gap-2">
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={handleUpdateTitle}
                  className="text-2xl font-bold border-0 px-0 focus-visible:ring-0 flex-1"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDelete}
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Created by {card.createdBy.name}</span>
                <span>•</span>
                <span>{format(new Date(card.createdAt), 'MMM d, yyyy')}</span>
              </div>
            </SheetHeader>

            <div className="space-y-4">
              <div>
                <Label className="text-base font-semibold">Due Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={`w-full justify-start text-left font-normal mt-2 ${
                        isOverdue ? 'border-red-500 text-red-600' : ''
                      }`}
                    >
                      {isOverdue && <AlertCircle className="mr-2 h-4 w-4" />}
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dueDate ? format(dueDate, 'PPP') : 'Set due date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dueDate}
                      onSelect={handleUpdateDueDate}
                      initialFocus
                    />
                    {dueDate && (
                      <div className="p-3 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUpdateDueDate(undefined)}
                          className="w-full"
                        >
                          Clear date
                        </Button>
                      </div>
                    )}
                  </PopoverContent>
                </Popover>
              </div>

              <Separator />

              <div>
                <Label className="text-base font-semibold">Description</Label>
                <div className="mt-2">
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    onBlur={handleUpdateDescription}
                    placeholder="Add a description..."
                    className="min-h-[120px]"
                  />
                </div>
              </div>

              <Separator />

              <div>
                <Label className="text-base font-semibold flex items-center justify-between">
                  <span>
                    Tasks ({localTasks.filter((t) => t.completed).length}/
                    {localTasks.length})
                  </span>
                  {overdueTasks.length > 0 && (
                    <Badge variant="destructive">
                      {overdueTasks.length} overdue
                    </Badge>
                  )}
                </Label>
                <div className="space-y-2 mt-2">
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleTaskDragEnd}
                  >
                    <SortableContext
                      items={localTasks.map((t) => t.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {localTasks.map((task) => (
                        <SortableTaskItem
                          key={task.id}
                          task={task}
                          users={users}
                          onToggle={handleToggleTask}
                          onUpdateAssignment={handleUpdateTaskAssignment}
                          onUpdateDueDate={handleUpdateTaskDueDate}
                          onUpdateText={handleUpdateTaskText}
                          onDelete={handleDeleteTask}
                        />
                      ))}
                    </SortableContext>
                  </DndContext>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a task..."
                      value={newTaskText}
                      onChange={(e) => setNewTaskText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddTask();
                      }}
                    />
                    <Button onClick={handleAddTask}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <Label className="text-base font-semibold">
                  Attachments ({card.attachments.length})
                </Label>
                <div className="space-y-2 mt-2">
                  {card.attachments.map((attachment: Attachment) => {
                    const isImage = attachment.mimeType.startsWith('image/');
                    return (
                      <div
                        key={attachment.id}
                        className="flex items-center gap-2 p-2 rounded-md border"
                      >
                        {isImage && (
                          <img
                            src={attachment.fileUrl}
                            alt={attachment.fileName}
                            className="h-12 w-12 object-cover rounded"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {attachment.fileName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {(attachment.fileSize / 1024).toFixed(1)} KB
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                          className="h-8 w-8 p-0"
                        >
                          <a
                            href={attachment.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            download
                          >
                            <Download className="h-4 w-4" />
                          </a>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteAttachment(attachment.id)}
                          className="h-8 w-8 p-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                  <div>
                    <input
                      type="file"
                      multiple
                      onChange={handleFileUpload}
                      disabled={isUploading}
                      className="hidden"
                      id="file-upload"
                    />
                    <Button
                      variant="outline"
                      onClick={() => document.getElementById('file-upload')?.click()}
                      disabled={isUploading}
                      className="w-full"
                    >
                      <Paperclip className="h-4 w-4 mr-2" />
                      {isUploading ? 'Uploading...' : 'Add attachment'}
                    </Button>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <Label className="text-base font-semibold">
                  Links ({card.links.length})
                </Label>
                <div className="space-y-2 mt-2">
                  {card.links.map((link: Link) => (
                    <div
                      key={link.id}
                      className="flex items-center gap-2 p-2 rounded-md border"
                    >
                      <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-primary hover:underline truncate block"
                        >
                          {link.title || link.url}
                        </a>
                        {link.title && (
                          <p className="text-xs text-muted-foreground truncate">
                            {link.url}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteLink(link.id)}
                        className="h-8 w-8 p-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <div className="space-y-2">
                    <Input
                      placeholder="URL (required)"
                      value={newLinkUrl}
                      onChange={(e) => setNewLinkUrl(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleAddLink();
                        }
                      }}
                    />
                    <Input
                      placeholder="Title (optional)"
                      value={newLinkTitle}
                      onChange={(e) => setNewLinkTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddLink();
                        }
                      }}
                    />
                    <Button
                      variant="outline"
                      onClick={handleAddLink}
                      className="w-full"
                      disabled={!newLinkUrl.trim()}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add link
                    </Button>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <Label className="text-base font-semibold">
                  Comments ({card.comments.length})
                </Label>
                <div className="space-y-4 mt-2">
                  {card.comments.map((comment: Comment) => (
                    <div key={comment.id} className="flex gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {comment.createdBy.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {comment.createdBy.name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(comment.createdAt), 'MMM d, h:mm a')}
                          </span>
                        </div>
                        <p className="text-sm break-all">{comment.textPlain}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteComment(comment.id)}
                        className="h-8 w-8 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <div className="space-y-2">
                    <Textarea
                      placeholder="Add a comment... (use @Name to mention someone)"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      rows={3}
                    />
                    <Button onClick={handleAddComment}>Post Comment</Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
