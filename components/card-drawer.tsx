'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card as CardType, Task, Comment, Attachment } from '@/lib/types';
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
} from 'lucide-react';
import { format, isPast, isToday } from 'date-fns';
import { updateCard, deleteCard } from '@/lib/actions/cards';
import { createTask, updateTask, deleteTask } from '@/lib/actions/tasks';
import { createComment, deleteComment } from '@/lib/actions/comments';
import { createAttachment, deleteAttachment } from '@/lib/actions/attachments';
import { toast } from 'sonner';

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

  useEffect(() => {
    if (card) {
      setTitle(card.title);

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
    await updateTask(task.id, { completed: !task.completed });
    onUpdate?.();
  };

  const handleUpdateTaskAssignment = async (taskId: string, userId: string | null) => {
    await updateTask(taskId, { assignedToId: userId });
    onUpdate?.();
    toast.success('Task assignment updated');
  };

  const handleUpdateTaskDueDate = async (taskId: string, date: Date | undefined) => {
    await updateTask(taskId, { dueDate: date || null });
    onUpdate?.();
    toast.success('Task due date updated');
  };

  const handleDeleteTask = async (taskId: string) => {
    await deleteTask(taskId);
    onUpdate?.();
    toast.success('Task deleted');
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

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this card?')) {
      await deleteCard(card.id);
      toast.success('Card deleted');
      onClose();
    }
  };

  const isOverdue = dueDate && isPast(dueDate) && !isToday(dueDate);
  const incompleteTasks = card.tasks.filter((t) => !t.completed);
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
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleUpdateTitle}
                className="text-2xl font-bold border-0 px-0 focus-visible:ring-0"
              />
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
                    Tasks ({card.tasks.filter((t) => t.completed).length}/
                    {card.tasks.length})
                  </span>
                  {overdueTasks.length > 0 && (
                    <Badge variant="destructive">
                      {overdueTasks.length} overdue
                    </Badge>
                  )}
                </Label>
                <div className="space-y-2 mt-2">
                  {card.tasks.map((task) => {
                    const taskOverdue =
                      task.dueDate &&
                      !task.completed &&
                      isPast(new Date(task.dueDate)) &&
                      !isToday(new Date(task.dueDate));

                    return (
                      <div
                        key={task.id}
                        className={`flex items-start gap-2 p-2 rounded-md border ${
                          taskOverdue ? 'border-red-200 bg-red-50 dark:bg-red-950/20' : ''
                        }`}
                      >
                        <Checkbox
                          checked={task.completed}
                          onCheckedChange={() => handleToggleTask(task)}
                          className="mt-1"
                        />
                        <div className="flex-1 space-y-2">
                          <p className={task.completed ? 'line-through text-muted-foreground' : ''}>
                            {task.text}
                          </p>
                          <div className="flex items-center gap-2">
                            <Select
                              value={task.assignedToId || 'unassigned'}
                              onValueChange={(value) =>
                                handleUpdateTaskAssignment(
                                  task.id,
                                  value === 'unassigned' ? null : value
                                )
                              }
                            >
                              <SelectTrigger className="w-32 h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="unassigned">Unassigned</SelectItem>
                                {users.map((user: { id: string; name: string; email: string }) => (
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
                                  className={`h-8 ${
                                    taskOverdue ? 'border-red-500 text-red-600' : ''
                                  }`}
                                >
                                  {taskOverdue && <AlertCircle className="mr-1 h-3 w-3" />}
                                  <CalendarIcon className="mr-1 h-3 w-3" />
                                  {task.dueDate
                                    ? format(new Date(task.dueDate), 'MMM d')
                                    : 'Due'}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={task.dueDate ? new Date(task.dueDate) : undefined}
                                  onSelect={(date) =>
                                    handleUpdateTaskDueDate(task.id, date)
                                  }
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteTask(task.id)}
                          className="h-8 w-8 p-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
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
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {comment.createdBy.name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(comment.createdAt), 'MMM d, h:mm a')}
                          </span>
                        </div>
                        <p className="text-sm">{comment.textPlain}</p>
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
                      placeholder="Add a comment... (use @Justin or @Grant to mention)"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      rows={3}
                    />
                    <Button onClick={handleAddComment}>Post Comment</Button>
                  </div>
                </div>
              </div>

              <Separator />

              <Button
                variant="destructive"
                onClick={handleDelete}
                className="w-full"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Card
              </Button>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
