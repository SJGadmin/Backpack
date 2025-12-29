'use client';

import { useState } from 'react';
import { Card as CardType, Task } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
} from 'date-fns';

interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  type: 'card' | 'task';
  cardId: string;
  taskId?: string;
}

interface CalendarViewProps {
  cards: CardType[];
  onEventClick: (cardId: string) => void;
}

export function CalendarView({ cards, onEventClick }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Extract events from cards and tasks
  const events: CalendarEvent[] = [];

  cards.forEach((card: CardType) => {
    // Add card due dates
    if (card.dueDate) {
      events.push({
        id: `card-${card.id}`,
        title: card.title,
        date: new Date(card.dueDate),
        type: 'card',
        cardId: card.id,
      });
    }

    // Add task due dates
    card.tasks.forEach((task: Task) => {
      if (task.dueDate) {
        events.push({
          id: `task-${task.id}`,
          title: `${card.title}: ${task.text}`,
          date: new Date(task.dueDate),
          type: 'task',
          cardId: card.id,
          taskId: task.id,
        });
      }
    });
  });

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getEventsForDay = (day: Date) => {
    return events.filter((event: CalendarEvent) => isSameDay(event.date, day));
  };

  const previousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToToday}>
            Today
          </Button>
          <Button variant="outline" size="sm" onClick={previousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day: string) => (
          <div
            key={day}
            className="text-center text-sm font-semibold text-muted-foreground p-2"
          >
            {day}
          </div>
        ))}

        {days.map((day: Date) => {
          const dayEvents = getEventsForDay(day);
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isToday = isSameDay(day, new Date());

          return (
            <Card
              key={day.toISOString()}
              className={`min-h-32 p-2 ${
                !isCurrentMonth ? 'bg-slate-50 dark:bg-slate-900/50 opacity-50' : ''
              } ${isToday ? 'ring-2 ring-blue-500' : ''}`}
            >
              <div className="text-sm font-medium mb-2">
                {format(day, 'd')}
              </div>
              <div className="space-y-1">
                {dayEvents.slice(0, 3).map((event: CalendarEvent) => (
                  <div
                    key={event.id}
                    onClick={() => onEventClick(event.cardId)}
                    className={`text-xs p-1 rounded cursor-pointer hover:opacity-80 ${
                      event.type === 'card'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100'
                        : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      <CalendarIcon className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{event.title}</span>
                    </div>
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-xs text-muted-foreground text-center">
                    +{dayEvents.length - 3} more
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-blue-100 dark:bg-blue-900"></div>
          <span>Card Due Date</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-100 dark:bg-green-900"></div>
          <span>Task Due Date</span>
        </div>
      </div>
    </div>
  );
}
