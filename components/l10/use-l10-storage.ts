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
        entries[index] = { ...entries[index], text };
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

  return { entries, updateEntry, setFocused };
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
        rows[index] = { ...rows[index], value };
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

  return { rows, updateRow, setFocused };
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
        rocks[index] = { ...rocks[index], ...updates };
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

  const deleteRock = useMutation(
    ({ storage }, rockId: string) => {
      const rocks = storage.get('rocks');
      const index = rocks.findIndex((r: any) => r.id === rockId);
      if (index !== -1) {
        rocks.splice(index, 1);
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

  return { rocks, updateRock, addRock, deleteRock, setFocused };
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
        todos[index] = { ...todos[index], ...updates };
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

  const deleteTodo = useMutation(
    ({ storage }, todoId: string) => {
      const todos = storage.get('lastWeekTodos');
      const index = todos.findIndex((t: any) => t.id === todoId);
      if (index !== -1) {
        todos.splice(index, 1);
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

  return { todos, updateTodo, addTodo, deleteTodo, setFocused };
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
        issues[index] = { ...issues[index], ...updates };
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
        issues.splice(index, 1);
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
        todos[index] = { ...todos[index], ...updates };
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
        todos.splice(index, 1);
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
        feedback[index] = { ...feedback[index], text };
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
        feedback.splice(index, 1);
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
        scores[index] = { ...scores[index], score };
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

// Hook for real-time parking lot items
export function useParkingLotItems() {
  const items = useStorage((root) => root.parkingLotItems);
  const updatePresence = useUpdateMyPresence();

  const updateItem = useMutation(
    ({ storage }, itemId: string, text: string) => {
      const items = storage.get('parkingLotItems');
      const index = items.findIndex((i: any) => i.id === itemId);
      if (index !== -1) {
        items[index] = { ...items[index], text };
      }
    },
    []
  );

  const addItem = useMutation(
    ({ storage }, item: { id: string; text: string; orderIndex: number }) => {
      const items = storage.get('parkingLotItems');
      items.push(item);
    },
    []
  );

  const deleteItem = useMutation(
    ({ storage }, itemId: string) => {
      const items = storage.get('parkingLotItems');
      const index = items.findIndex((i: any) => i.id === itemId);
      if (index !== -1) {
        items.splice(index, 1);
      }
    },
    []
  );

  const setFocused = useCallback(
    (focused: boolean) => {
      updatePresence({ focusedSection: focused ? 'Parking Lot' : null });
    },
    [updatePresence]
  );

  return { items, updateItem, addItem, deleteItem, setFocused };
}
