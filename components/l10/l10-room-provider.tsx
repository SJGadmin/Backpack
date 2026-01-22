'use client';

import { ReactNode, useEffect, useRef } from 'react';
import { LiveList } from '@liveblocks/client';
import { RoomProvider, useMutation, useOthers, useSelf, useRoom } from '@/liveblocks.config';
import { ClientSideSuspense } from '@liveblocks/react';
import type { L10Document, UserInfo } from '@/lib/types';

interface L10RoomProviderProps {
  documentId: string;
  initialDocument: L10Document;
  users: UserInfo[];
  children: ReactNode;
}

// Loading component while room is connecting
function RoomLoading() {
  return (
    <div className="flex items-center justify-center h-full">
      <p className="text-muted-foreground">Connecting to room...</p>
    </div>
  );
}

// Helper to clear a LiveList
function clearLiveList(list: any) {
  while (list.length > 0) {
    list.delete(0);
  }
}

// Component to sync storage with DB on mount
function StorageSyncer({ initialDocument }: { initialDocument: L10Document }) {
  const hasSynced = useRef(false);
  const room = useRoom();

  const syncStorage = useMutation(({ storage }) => {
    // Update all storage arrays with the latest data from DB
    const segueEntries = storage.get('segueEntries');
    clearLiveList(segueEntries);
    initialDocument.segueEntries.forEach((e) => {
      segueEntries.push({
        id: e.id,
        userId: e.userId,
        text: e.text,
        orderIndex: e.orderIndex,
      });
    });

    const scorecardRows = storage.get('scorecardRows');
    clearLiveList(scorecardRows);
    initialDocument.scorecardRows.forEach((r) => {
      scorecardRows.push({
        id: r.id,
        metricId: r.metricId,
        value: r.value,
      });
    });

    const rocks = storage.get('rocks');
    clearLiveList(rocks);
    initialDocument.rocks.forEach((r) => {
      rocks.push({
        id: r.id,
        userId: r.userId,
        title: r.title,
        isOnTrack: r.isOnTrack,
        orderIndex: r.orderIndex,
      });
    });

    const lastWeekTodos = storage.get('lastWeekTodos');
    clearLiveList(lastWeekTodos);
    initialDocument.lastWeekTodos.forEach((t) => {
      lastWeekTodos.push({
        id: t.id,
        userId: t.userId,
        text: t.text,
        isDone: t.isDone,
        orderIndex: t.orderIndex,
      });
    });

    const idsIssues = storage.get('idsIssues');
    clearLiveList(idsIssues);
    initialDocument.idsIssues.forEach((i) => {
      idsIssues.push({
        id: i.id,
        title: i.title,
        identify: i.identify,
        discuss: i.discuss,
        solve: i.solve,
        ownerId: i.ownerId,
        dueDate: i.dueDate?.toString() || null,
        isResolved: i.isResolved,
        orderIndex: i.orderIndex,
      });
    });

    const newTodos = storage.get('newTodos');
    clearLiveList(newTodos);
    initialDocument.newTodos.forEach((t) => {
      newTodos.push({
        id: t.id,
        userId: t.userId,
        text: t.text,
        dueDate: t.dueDate?.toString() || null,
        orderIndex: t.orderIndex,
      });
    });

    const wrapFeedback = storage.get('wrapFeedback');
    clearLiveList(wrapFeedback);
    initialDocument.wrapFeedback.forEach((f) => {
      wrapFeedback.push({
        id: f.id,
        type: f.type as 'positive' | 'negative',
        text: f.text,
        orderIndex: f.orderIndex,
      });
    });

    const wrapScores = storage.get('wrapScores');
    clearLiveList(wrapScores);
    initialDocument.wrapScores.forEach((s) => {
      wrapScores.push({
        id: s.id,
        userId: s.userId,
        score: s.score,
      });
    });

    const parkingLotItems = storage.get('parkingLotItems');
    clearLiveList(parkingLotItems);
    initialDocument.parkingLotItems.forEach((p) => {
      parkingLotItems.push({
        id: p.id,
        text: p.text,
        orderIndex: p.orderIndex,
      });
    });
  }, [initialDocument]);

  useEffect(() => {
    // Only sync once per mount, and only if we're connected
    if (!hasSynced.current && room.getStatus() === 'connected') {
      syncStorage();
      hasSynced.current = true;
    }
  }, [room, syncStorage]);

  return null;
}

export function L10RoomProvider({
  documentId,
  initialDocument,
  users,
  children,
}: L10RoomProviderProps) {
  const roomId = `l10-document-${documentId}`;

  // Convert document data to initial storage format with LiveLists
  const initialStorage = {
    title: initialDocument.title,
    meetingDate: initialDocument.meetingDate.toString(),
    weekNumber: initialDocument.weekNumber,
    segueEntries: new LiveList(initialDocument.segueEntries.map((e) => ({
      id: e.id,
      userId: e.userId,
      text: e.text,
      orderIndex: e.orderIndex,
    }))),
    scorecardRows: new LiveList(initialDocument.scorecardRows.map((r) => ({
      id: r.id,
      metricId: r.metricId,
      value: r.value,
    }))),
    rocks: new LiveList(initialDocument.rocks.map((r) => ({
      id: r.id,
      userId: r.userId,
      title: r.title,
      isOnTrack: r.isOnTrack,
      orderIndex: r.orderIndex,
    }))),
    lastWeekTodos: new LiveList(initialDocument.lastWeekTodos.map((t) => ({
      id: t.id,
      userId: t.userId,
      text: t.text,
      isDone: t.isDone,
      orderIndex: t.orderIndex,
    }))),
    idsIssues: new LiveList(initialDocument.idsIssues.map((i) => ({
      id: i.id,
      title: i.title,
      identify: i.identify,
      discuss: i.discuss,
      solve: i.solve,
      ownerId: i.ownerId,
      dueDate: i.dueDate?.toString() || null,
      isResolved: i.isResolved,
      orderIndex: i.orderIndex,
    }))),
    newTodos: new LiveList(initialDocument.newTodos.map((t) => ({
      id: t.id,
      userId: t.userId,
      text: t.text,
      dueDate: t.dueDate?.toString() || null,
      orderIndex: t.orderIndex,
    }))),
    wrapFeedback: new LiveList(initialDocument.wrapFeedback.map((f) => ({
      id: f.id,
      type: f.type as 'positive' | 'negative',
      text: f.text,
      orderIndex: f.orderIndex,
    }))),
    wrapScores: new LiveList(initialDocument.wrapScores.map((s) => ({
      id: s.id,
      userId: s.userId,
      score: s.score,
    }))),
    parkingLotItems: new LiveList(initialDocument.parkingLotItems.map((p) => ({
      id: p.id,
      text: p.text,
      orderIndex: p.orderIndex,
    }))),
  };

  return (
    <RoomProvider
      id={roomId}
      initialPresence={{
        cursor: null,
        user: null,
        focusedSection: null,
      }}
      initialStorage={initialStorage}
    >
      <ClientSideSuspense fallback={<RoomLoading />}>
        {() => (
          <>
            <StorageSyncer initialDocument={initialDocument} />
            {children}
          </>
        )}
      </ClientSideSuspense>
    </RoomProvider>
  );
}

// Hook to get presence info for display
export function useL10Presence() {
  const others = useOthers();
  const self = useSelf();

  return {
    others: others.map((other) => ({
      connectionId: other.connectionId,
      user: other.info,
      presence: other.presence,
    })),
    self: self
      ? {
          connectionId: self.connectionId,
          user: self.info,
          presence: self.presence,
        }
      : null,
  };
}
