import { createClient, LiveList } from '@liveblocks/client';
import { createRoomContext } from '@liveblocks/react';

const client = createClient({
  authEndpoint: '/api/liveblocks-auth',
});

// Types for L10 document presence and storage
type Presence = {
  cursor: { x: number; y: number } | null;
  user: {
    id: string;
    name: string;
    email: string;
  } | null;
  focusedSection: string | null;
};

// Storage types for L10 document sections
type SegueEntry = {
  id: string;
  userId: string;
  text: string;
  orderIndex: number;
};

type ScorecardRow = {
  id: string;
  metricId: string;
  value: number | null;
};

type Rock = {
  id: string;
  userId: string;
  title: string;
  isOnTrack: boolean;
  orderIndex: number;
};

type LastWeekTodo = {
  id: string;
  userId: string;
  text: string;
  isDone: boolean;
  orderIndex: number;
};

type IdsIssue = {
  id: string;
  title: string;
  identify: string | null;
  discuss: string | null;
  solve: string | null;
  ownerId: string | null;
  dueDate: string | null;
  isResolved: boolean;
  orderIndex: number;
};

type NewTodo = {
  id: string;
  userId: string;
  text: string;
  dueDate: string | null;
  orderIndex: number;
};

type WrapFeedback = {
  id: string;
  type: 'positive' | 'negative';
  text: string;
  orderIndex: number;
};

type WrapScore = {
  id: string;
  userId: string;
  score: number;
};

type Storage = {
  // Document metadata
  title: string;
  meetingDate: string;
  weekNumber: number | null;

  // Section data stored as LiveLists for real-time sync
  segueEntries: LiveList<SegueEntry>;
  scorecardRows: LiveList<ScorecardRow>;
  rocks: LiveList<Rock>;
  lastWeekTodos: LiveList<LastWeekTodo>;
  idsIssues: LiveList<IdsIssue>;
  newTodos: LiveList<NewTodo>;
  wrapFeedback: LiveList<WrapFeedback>;
  wrapScores: LiveList<WrapScore>;
  // Note: parkingLotItems removed - now stored globally in database
};

type UserMeta = {
  id: string;
  info: {
    name: string;
    email: string;
    color: string;
  };
};

type RoomEvent = {
  type: 'REFRESH_FROM_DB';
};

export const {
  RoomProvider,
  useRoom,
  useMyPresence,
  useUpdateMyPresence,
  useSelf,
  useOthers,
  useOthersMapped,
  useOthersConnectionIds,
  useOther,
  useBroadcastEvent,
  useEventListener,
  useStorage,
  useMutation,
  useStatus,
  useLostConnectionListener,
} = createRoomContext<Presence, Storage, UserMeta, RoomEvent>(client);
