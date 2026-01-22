import { Liveblocks } from '@liveblocks/node';
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY!,
});

// Generate a consistent color based on user id
function getUserColor(userId: string): string {
  const colors = [
    '#E57373', '#F06292', '#BA68C8', '#9575CD',
    '#7986CB', '#64B5F6', '#4FC3F7', '#4DD0E1',
    '#4DB6AC', '#81C784', '#AED581', '#DCE775',
    '#FFD54F', '#FFB74D', '#FF8A65', '#A1887F',
  ];
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export async function POST(request: NextRequest) {
  const session = await getSession();

  if (!session.isLoggedIn || !session.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, name: true, email: true },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // Get room from request body
  const body = await request.json();
  const { room } = body;

  // Create a Liveblocks session for this user
  const liveblocksSession = liveblocks.prepareSession(user.id, {
    userInfo: {
      name: user.name,
      email: user.email,
      color: getUserColor(user.id),
    },
  });

  // Give the user access to the requested room
  // Room names follow the pattern: l10-document-{documentId}
  if (room && room.startsWith('l10-document-')) {
    liveblocksSession.allow(room, liveblocksSession.FULL_ACCESS);
  }

  const { status, body: responseBody } = await liveblocksSession.authorize();

  return new NextResponse(responseBody, { status });
}
