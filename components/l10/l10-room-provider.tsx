'use client';

import { ReactNode } from 'react';
import { LiveList } from '@liveblocks/client';
import { RoomProvider, useOthers, useSelf } from '@/liveblocks.config';
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
    scorecardNotes: initialDocument.scorecardNotes || '',
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
        {() => children}
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
