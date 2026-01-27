'use client';

import { useCallback } from 'react';
import { useStorage, useMutation, useUpdateMyPresence } from '@/liveblocks.config';

// Hook for real-time segue entries
export function useSegueEntries() {
  const entries = useStorage((root) => root.segueEntries);
  const updatePresence = useUpdateMyPresence();

  const updateEntry = useMutation(
    ({ storage }, entryId: string, text: string) => {
      const entries = storage.get('segueEntries');
      const index = entries.findIndex((e: any) => e.id === entryId);
      if (index !== -1) {
        const current = entries.get(index);
        if (current) {
          entries.set(index, { ...current, text });
        }
      }
    },
    []
  );

  const updateEntryByUserId = useMutation(
    ({ storage }, userId: string, text: string) => {
      const entries = storage.get('segueEntries');
      const index = entries.findIndex((e: any) => e.userId === userId);
      if (index !== -1) {
        const current = entries.get(index);
        if (current) {
          entries.set(index, { ...current, text });
        }
      }
    },
    []
  );

  const setFocused = useCallback(
    (focused: boolean) => {
      updatePresence({ focusedSection: focused ? 'Segue' : null });
    },
    [updatePresence]
  );

  return { entries, updateEntry, updateEntryByUserId, setFocused };
}

// Hook for real-time scorecard rows
export function useScorecardRows() {
  const rows = useStorage((root) => root.scorecardRows);
  const updatePresence = useUpdateMyPresence();

  const updateRow = useMutation(
    ({ storage }, rowId: string, value: number | null) => {
      const rows = storage.get('scorecardRows');
      const index = rows.findIndex((r: any) => r.id === rowId);
      if (index !== -1) {
        const current = rows.get(index);
        if (current) {
          rows.set(index, { ...current, value });
        }
      }
    },
    []
  );

  const updateRowByMetricId = useMutation(
    ({ storage }, metricId: string, value: number | null) => {
      const rows = storage.get('scorecardRows');
      const index = rows.findIndex((r: any) => r.metricId === metricId);
      if (index !== -1) {
        const current = rows.get(index);
        if (current) {
          rows.set(index, { ...current, value });
        }
      }
    },
    []
  );

  const setFocused = useCallback(
    (focused: boolean) => {
      updatePresence({ focusedSection: focused ? 'Scorecard' : null });
    },
    [updatePresence]
  );

  return { rows, updateRow, updateRowByMetricId, setFocused };
}

// Hook for real-time rocks
export function useRocks() {
  const rocks = useStorage((root) => root.rocks);
  const updatePresence = useUpdateMyPresence();

  const updateRock = useMutation(
    ({ storage }, rockId: string, updates: Partial<{ title: string; isOnTrack: boolean }>) => {
      const rocks = storage.get('rocks');
      const index = rocks.findIndex((r: any) => r.id === rockId);
      if (index !== -1) {
        const current = rocks.get(index);
        if (current) {
          rocks.set(index, { ...current, ...updates });
        }
      }
    },
    []
  );

  const addRock = useMutation(
    ({ storage }, rock: { id: string; userId: string; title: string; isOnTrack: boolean; orderIndex: number }) => {
      const rocks = storage.get('rocks');
      rocks.push(rock);
    },
    []
  );

  const addRocks = useMutation(
    ({ storage }, newRocks: { id: string; userId: string; title: string; isOnTrack: boolean; orderIndex: number }[]) => {
      const rocks = storage.get('rocks');
      // Only add rocks that don't already exist
      newRocks.forEach((rock) => {
        const exists = rocks.findIndex((r: any) => r.id === rock.id) !== -1;
        if (!exists) {
          rocks.push(rock);
        }
      });
    },
    []
  );

  const deleteRock = useMutation(
    ({ storage }, rockId: string) => {
      const rocks = storage.get('rocks');
      const index = rocks.findIndex((r: any) => r.id === rockId);
      if (index !== -1) {
        rocks.delete(index);
      }
    },
    []
  );

  const setFocused = useCallback(
    (focused: boolean) => {
      updatePresence({ focusedSection: focused ? 'Rocks' : null });
    },
    [updatePresence]
  );

  return { rocks, updateRock, addRock, addRocks, deleteRock, setFocused };
}

// Hook for real-time last week todos
export function useLastWeekTodos() {
  const todos = useStorage((root) => root.lastWeekTodos);
  const updatePresence = useUpdateMyPresence();

  const updateTodo = useMutation(
    ({ storage }, todoId: string, updates: Partial<{ text: string; isDone: boolean }>) => {
      const todos = storage.get('lastWeekTodos');
      const index = todos.findIndex((t: any) => t.id === todoId);
      if (index !== -1) {
        const current = todos.get(index);
        if (current) {
          todos.set(index, { ...current, ...updates });
        }
      }
    },
    []
  );

  const addTodo = useMutation(
    ({ storage }, todo: { id: string; userId: string; text: string; isDone: boolean; orderIndex: number }) => {
      const todos = storage.get('lastWeekTodos');
      todos.push(todo);
    },
    []
  );

  const addTodos = useMutation(
    ({ storage }, newTodos: { id: string; userId: string; text: string; isDone: boolean; orderIndex: number }[]) => {
      const todos = storage.get('lastWeekTodos');
      // Only add todos that don't already exist
      newTodos.forEach((todo) => {
        const exists = todos.findIndex((t: any) => t.id === todo.id) !== -1;
        if (!exists) {
          todos.push(todo);
        }
      });
    },
    []
  );

  const deleteTodo = useMutation(
    ({ storage }, todoId: string) => {
      const todos = storage.get('lastWeekTodos');
      const index = todos.findIndex((t: any) => t.id === todoId);
      if (index !== -1) {
        todos.delete(index);
      }
    },
    []
  );

  const setFocused = useCallback(
    (focused: boolean) => {
      updatePresence({ focusedSection: focused ? 'Last Week Todos' : null });
    },
    [updatePresence]
  );

  return { todos, updateTodo, addTodo, addTodos, deleteTodo, setFocused };
}

// Hook for real-time IDS issues
export function useIdsIssues() {
  const issues = useStorage((root) => root.idsIssues);
  const updatePresence = useUpdateMyPresence();

  const updateIssue = useMutation(
    ({ storage }, issueId: string, updates: Partial<{
      title: string;
      identify: string | null;
      discuss: string | null;
      solve: string | null;
      ownerId: string | null;
      dueDate: string | null;
      isResolved: boolean;
    }>) => {
      const issues = storage.get('idsIssues');
      const index = issues.findIndex((i: any) => i.id === issueId);
      if (index !== -1) {
        const current = issues.get(index);
        if (current) {
          issues.set(index, { ...current, ...updates });
        }
      }
    },
    []
  );

  const addIssue = useMutation(
    ({ storage }, issue: {
      id: string;
      title: string;
      identify: string | null;
      discuss: string | null;
      solve: string | null;
      ownerId: string | null;
      dueDate: string | null;
      isResolved: boolean;
      orderIndex: number;
    }) => {
      const issues = storage.get('idsIssues');
      issues.push(issue);
    },
    []
  );

  const deleteIssue = useMutation(
    ({ storage }, issueId: string) => {
      const issues = storage.get('idsIssues');
      const index = issues.findIndex((i: any) => i.id === issueId);
      if (index !== -1) {
        issues.delete(index);
      }
    },
    []
  );

  const setFocused = useCallback(
    (focused: boolean) => {
      updatePresence({ focusedSection: focused ? 'IDS' : null });
    },
    [updatePresence]
  );

  return { issues, updateIssue, addIssue, deleteIssue, setFocused };
}

// Hook for real-time new todos
export function useNewTodos() {
  const todos = useStorage((root) => root.newTodos);
  const updatePresence = useUpdateMyPresence();

  const updateTodo = useMutation(
    ({ storage }, todoId: string, updates: Partial<{ text: string; dueDate: string | null }>) => {
      const todos = storage.get('newTodos');
      const index = todos.findIndex((t: any) => t.id === todoId);
      if (index !== -1) {
        const current = todos.get(index);
        if (current) {
          todos.set(index, { ...current, ...updates });
        }
      }
    },
    []
  );

  const addTodo = useMutation(
    ({ storage }, todo: { id: string; userId: string; text: string; dueDate: string | null; orderIndex: number }) => {
      const todos = storage.get('newTodos');
      todos.push(todo);
    },
    []
  );

  const deleteTodo = useMutation(
    ({ storage }, todoId: string) => {
      const todos = storage.get('newTodos');
      const index = todos.findIndex((t: any) => t.id === todoId);
      if (index !== -1) {
        todos.delete(index);
      }
    },
    []
  );

  const setFocused = useCallback(
    (focused: boolean) => {
      updatePresence({ focusedSection: focused ? 'New Todos' : null });
    },
    [updatePresence]
  );

  return { todos, updateTodo, addTodo, deleteTodo, setFocused };
}

// Hook for real-time wrap feedback
export function useWrapFeedback() {
  const feedback = useStorage((root) => root.wrapFeedback);
  const updatePresence = useUpdateMyPresence();

  const updateFeedback = useMutation(
    ({ storage }, feedbackId: string, text: string) => {
      const feedback = storage.get('wrapFeedback');
      const index = feedback.findIndex((f: any) => f.id === feedbackId);
      if (index !== -1) {
        const current = feedback.get(index);
        if (current) {
          feedback.set(index, { ...current, text });
        }
      }
    },
    []
  );

  const addFeedback = useMutation(
    ({ storage }, item: { id: string; type: 'positive' | 'negative'; text: string; orderIndex: number }) => {
      const feedback = storage.get('wrapFeedback');
      feedback.push(item);
    },
    []
  );

  const deleteFeedback = useMutation(
    ({ storage }, feedbackId: string) => {
      const feedback = storage.get('wrapFeedback');
      const index = feedback.findIndex((f: any) => f.id === feedbackId);
      if (index !== -1) {
        feedback.delete(index);
      }
    },
    []
  );

  const setFocused = useCallback(
    (focused: boolean) => {
      updatePresence({ focusedSection: focused ? 'Wrap' : null });
    },
    [updatePresence]
  );

  return { feedback, updateFeedback, addFeedback, deleteFeedback, setFocused };
}

// Hook for real-time wrap scores
export function useWrapScores() {
  const scores = useStorage((root) => root.wrapScores);

  const updateScore = useMutation(
    ({ storage }, scoreId: string, score: number) => {
      const scores = storage.get('wrapScores');
      const index = scores.findIndex((s: any) => s.id === scoreId);
      if (index !== -1) {
        const current = scores.get(index);
        if (current) {
          scores.set(index, { ...current, score });
        }
      }
    },
    []
  );

  const addScore = useMutation(
    ({ storage }, item: { id: string; userId: string; score: number }) => {
      const scores = storage.get('wrapScores');
      scores.push(item);
    },
    []
  );

  return { scores, updateScore, addScore };
}

// Note: useParkingLotItems hook removed - parking lot is now global and stored in database
