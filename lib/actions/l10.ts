'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from './auth';

// ============================================
// FOLDER ACTIONS
// ============================================

export async function getL10Folders() {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  const folders = await prisma.l10Folder.findMany({
    orderBy: { orderIndex: 'asc' },
    include: {
      _count: {
        select: { documents: true },
      },
    },
  });

  return folders;
}

export async function createL10Folder(name: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  const maxFolder = await prisma.l10Folder.findFirst({
    orderBy: { orderIndex: 'desc' },
  });

  const folder = await prisma.l10Folder.create({
    data: {
      name,
      orderIndex: (maxFolder?.orderIndex ?? -1) + 1,
    },
    include: {
      _count: {
        select: { documents: true },
      },
    },
  });

  revalidatePath('/board');
  return folder;
}

export async function updateL10Folder(folderId: string, name: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  try {
    const folder = await prisma.l10Folder.update({
      where: { id: folderId },
      data: { name },
      include: {
        _count: {
          select: { documents: true },
        },
      },
    });

    revalidatePath('/board');
    return folder;
  } catch (error: any) {
    if (error.code === 'P2025') {
      console.log(`Folder ${folderId} not found for update`);
      revalidatePath('/board');
      return null;
    }
    throw error;
  }
}

export async function deleteL10Folder(folderId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  try {
    await prisma.l10Folder.delete({
      where: { id: folderId },
    });
  } catch (error: any) {
    if (error.code === 'P2025') {
      console.log(`Folder ${folderId} already deleted or doesn't exist`);
      revalidatePath('/board');
      return;
    }
    throw error;
  }

  revalidatePath('/board');
}

export async function reorderL10Folders(folderIds: string[]) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  await prisma.$transaction(
    folderIds.map((id, index) =>
      prisma.l10Folder.update({
        where: { id },
        data: { orderIndex: index },
      })
    )
  );

  revalidatePath('/board');
}

// ============================================
// DOCUMENT ACTIONS
// ============================================

export async function getL10DocumentsForFolder(folderId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  const documents = await prisma.l10Document.findMany({
    where: { folderId },
    orderBy: { orderIndex: 'desc' },
    select: {
      id: true,
      title: true,
      meetingDate: true,
      weekNumber: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return documents;
}

export async function getL10Document(documentId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  const document = await prisma.l10Document.findUnique({
    where: { id: documentId },
    include: {
      folder: true,
      segueEntries: {
        orderBy: { orderIndex: 'asc' },
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
      scorecardRows: {
        include: { metric: true },
      },
      rocks: {
        orderBy: { orderIndex: 'asc' },
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
      lastWeekTodos: {
        orderBy: { orderIndex: 'asc' },
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
      idsIssues: {
        orderBy: { orderIndex: 'asc' },
        include: {
          owner: { select: { id: true, name: true, email: true } },
        },
      },
      newTodos: {
        orderBy: { orderIndex: 'asc' },
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
      wrapFeedback: {
        orderBy: { orderIndex: 'asc' },
      },
      wrapScores: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
      parkingLotItems: {
        orderBy: { orderIndex: 'asc' },
      },
    },
  });

  return document;
}

export async function createL10Document(
  folderId: string,
  title: string,
  meetingDate: Date,
  weekNumber?: number
) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  const maxDoc = await prisma.l10Document.findFirst({
    where: { folderId },
    orderBy: { orderIndex: 'desc' },
  });

  const document = await prisma.l10Document.create({
    data: {
      folderId,
      title,
      meetingDate,
      weekNumber,
      orderIndex: (maxDoc?.orderIndex ?? -1) + 1,
    },
  });

  revalidatePath('/board');
  return document;
}

export async function updateL10Document(
  documentId: string,
  data: {
    title?: string;
    meetingDate?: Date;
    weekNumber?: number | null;
  }
) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  try {
    const document = await prisma.l10Document.update({
      where: { id: documentId },
      data,
    });

    revalidatePath('/board');
    return document;
  } catch (error: any) {
    if (error.code === 'P2025') {
      console.log(`Document ${documentId} not found for update`);
      revalidatePath('/board');
      return null;
    }
    throw error;
  }
}

export async function deleteL10Document(documentId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  try {
    await prisma.l10Document.delete({
      where: { id: documentId },
    });
  } catch (error: any) {
    if (error.code === 'P2025') {
      console.log(`Document ${documentId} already deleted or doesn't exist`);
      revalidatePath('/board');
      return;
    }
    throw error;
  }

  revalidatePath('/board');
}

export async function reorderL10Documents(documentIds: string[]) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  await prisma.$transaction(
    documentIds.map((id, index) =>
      prisma.l10Document.update({
        where: { id },
        data: { orderIndex: index },
      })
    )
  );

  revalidatePath('/board');
}

// ============================================
// SEGUE ACTIONS
// ============================================

export async function updateSegueEntry(
  documentId: string,
  userId: string,
  text: string
) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  const maxEntry = await prisma.l10SegueEntry.findFirst({
    where: { documentId },
    orderBy: { orderIndex: 'desc' },
  });

  const entry = await prisma.l10SegueEntry.upsert({
    where: {
      documentId_userId: { documentId, userId },
    },
    update: { text },
    create: {
      documentId,
      userId,
      text,
      orderIndex: (maxEntry?.orderIndex ?? -1) + 1,
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });

  revalidatePath('/board');
  return entry;
}

// ============================================
// SCORECARD METRICS ACTIONS
// ============================================

export async function getScorecardMetrics() {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  const metrics = await prisma.l10ScorecardMetric.findMany({
    where: { isActive: true },
    orderBy: { orderIndex: 'asc' },
  });

  return metrics;
}

export async function createScorecardMetric(name: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  const maxMetric = await prisma.l10ScorecardMetric.findFirst({
    orderBy: { orderIndex: 'desc' },
  });

  const metric = await prisma.l10ScorecardMetric.create({
    data: {
      name,
      orderIndex: (maxMetric?.orderIndex ?? -1) + 1,
    },
  });

  revalidatePath('/board');
  return metric;
}

export async function updateScorecardMetric(
  metricId: string,
  data: { name?: string; isActive?: boolean }
) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  try {
    const metric = await prisma.l10ScorecardMetric.update({
      where: { id: metricId },
      data,
    });

    revalidatePath('/board');
    return metric;
  } catch (error: any) {
    if (error.code === 'P2025') {
      console.log(`Metric ${metricId} not found for update`);
      revalidatePath('/board');
      return null;
    }
    throw error;
  }
}

export async function deleteScorecardMetric(metricId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  try {
    await prisma.l10ScorecardMetric.delete({
      where: { id: metricId },
    });
  } catch (error: any) {
    if (error.code === 'P2025') {
      console.log(`Metric ${metricId} already deleted or doesn't exist`);
      revalidatePath('/board');
      return;
    }
    throw error;
  }

  revalidatePath('/board');
}

export async function reorderScorecardMetrics(metricIds: string[]) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  await prisma.$transaction(
    metricIds.map((id, index) =>
      prisma.l10ScorecardMetric.update({
        where: { id },
        data: { orderIndex: index },
      })
    )
  );

  revalidatePath('/board');
}

// ============================================
// SCORECARD ROW ACTIONS
// ============================================

export async function updateScorecardRow(
  documentId: string,
  metricId: string,
  value: number | null,
  notes?: string
) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  const row = await prisma.l10ScorecardRow.upsert({
    where: {
      documentId_metricId: { documentId, metricId },
    },
    update: { value, notes },
    create: {
      documentId,
      metricId,
      value,
      notes,
    },
    include: { metric: true },
  });

  revalidatePath('/board');
  return row;
}

// ============================================
// ROCKS ACTIONS
// ============================================

export async function createRock(
  documentId: string,
  userId: string,
  title: string
) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  const maxRock = await prisma.l10Rock.findFirst({
    where: { documentId },
    orderBy: { orderIndex: 'desc' },
  });

  const rock = await prisma.l10Rock.create({
    data: {
      documentId,
      userId,
      title,
      orderIndex: (maxRock?.orderIndex ?? -1) + 1,
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });

  revalidatePath('/board');
  return rock;
}

export async function updateRock(
  rockId: string,
  data: { title?: string; isOnTrack?: boolean }
) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  try {
    const rock = await prisma.l10Rock.update({
      where: { id: rockId },
      data,
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    revalidatePath('/board');
    return rock;
  } catch (error: any) {
    if (error.code === 'P2025') {
      console.log(`Rock ${rockId} not found for update`);
      revalidatePath('/board');
      return null;
    }
    throw error;
  }
}

export async function deleteRock(rockId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  try {
    await prisma.l10Rock.delete({
      where: { id: rockId },
    });
  } catch (error: any) {
    if (error.code === 'P2025') {
      console.log(`Rock ${rockId} already deleted or doesn't exist`);
      revalidatePath('/board');
      return;
    }
    throw error;
  }

  revalidatePath('/board');
}

// ============================================
// LAST WEEK TO-DOS ACTIONS
// ============================================

export async function createLastWeekTodo(
  documentId: string,
  userId: string,
  text: string
) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  const maxTodo = await prisma.l10LastWeekTodo.findFirst({
    where: { documentId },
    orderBy: { orderIndex: 'desc' },
  });

  const todo = await prisma.l10LastWeekTodo.create({
    data: {
      documentId,
      userId,
      text,
      orderIndex: (maxTodo?.orderIndex ?? -1) + 1,
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });

  revalidatePath('/board');
  return todo;
}

export async function updateLastWeekTodo(
  todoId: string,
  data: { text?: string; isDone?: boolean }
) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  try {
    const todo = await prisma.l10LastWeekTodo.update({
      where: { id: todoId },
      data,
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    revalidatePath('/board');
    return todo;
  } catch (error: any) {
    if (error.code === 'P2025') {
      console.log(`LastWeekTodo ${todoId} not found for update`);
      revalidatePath('/board');
      return null;
    }
    throw error;
  }
}

export async function deleteLastWeekTodo(todoId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  try {
    await prisma.l10LastWeekTodo.delete({
      where: { id: todoId },
    });
  } catch (error: any) {
    if (error.code === 'P2025') {
      console.log(`LastWeekTodo ${todoId} already deleted or doesn't exist`);
      revalidatePath('/board');
      return;
    }
    throw error;
  }

  revalidatePath('/board');
}

// ============================================
// IDS ISSUES ACTIONS
// ============================================

export async function createIdsIssue(documentId: string, title: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  const maxIssue = await prisma.l10IdsIssue.findFirst({
    where: { documentId },
    orderBy: { issueNumber: 'desc' },
  });

  const maxOrder = await prisma.l10IdsIssue.findFirst({
    where: { documentId },
    orderBy: { orderIndex: 'desc' },
  });

  const issue = await prisma.l10IdsIssue.create({
    data: {
      documentId,
      title,
      issueNumber: (maxIssue?.issueNumber ?? 0) + 1,
      orderIndex: (maxOrder?.orderIndex ?? -1) + 1,
    },
    include: {
      owner: { select: { id: true, name: true, email: true } },
    },
  });

  revalidatePath('/board');
  return issue;
}

export async function updateIdsIssue(
  issueId: string,
  data: {
    title?: string;
    identify?: string | null;
    discuss?: string | null;
    solve?: string | null;
    ownerId?: string | null;
    dueDate?: Date | null;
    isResolved?: boolean;
  }
) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  try {
    const issue = await prisma.l10IdsIssue.update({
      where: { id: issueId },
      data,
      include: {
        owner: { select: { id: true, name: true, email: true } },
      },
    });

    revalidatePath('/board');
    return issue;
  } catch (error: any) {
    if (error.code === 'P2025') {
      console.log(`IdsIssue ${issueId} not found for update`);
      revalidatePath('/board');
      return null;
    }
    throw error;
  }
}

export async function deleteIdsIssue(issueId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  try {
    await prisma.l10IdsIssue.delete({
      where: { id: issueId },
    });
  } catch (error: any) {
    if (error.code === 'P2025') {
      console.log(`IdsIssue ${issueId} already deleted or doesn't exist`);
      revalidatePath('/board');
      return;
    }
    throw error;
  }

  revalidatePath('/board');
}

export async function reorderIdsIssues(documentId: string, issueIds: string[]) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  await prisma.$transaction(
    issueIds.map((id, index) =>
      prisma.l10IdsIssue.update({
        where: { id },
        data: { orderIndex: index },
      })
    )
  );

  revalidatePath('/board');
}

// ============================================
// NEW TO-DOS ACTIONS
// ============================================

export async function createNewTodo(
  documentId: string,
  userId: string,
  text: string,
  dueDate?: Date
) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  const maxTodo = await prisma.l10NewTodo.findFirst({
    where: { documentId },
    orderBy: { orderIndex: 'desc' },
  });

  const todo = await prisma.l10NewTodo.create({
    data: {
      documentId,
      userId,
      text,
      dueDate,
      orderIndex: (maxTodo?.orderIndex ?? -1) + 1,
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });

  revalidatePath('/board');
  return todo;
}

export async function updateNewTodo(
  todoId: string,
  data: { text?: string; dueDate?: Date | null; isCompleted?: boolean }
) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  try {
    const todo = await prisma.l10NewTodo.update({
      where: { id: todoId },
      data,
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    revalidatePath('/board');
    return todo;
  } catch (error: any) {
    if (error.code === 'P2025') {
      console.log(`NewTodo ${todoId} not found for update`);
      revalidatePath('/board');
      return null;
    }
    throw error;
  }
}

export async function deleteNewTodo(todoId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  try {
    await prisma.l10NewTodo.delete({
      where: { id: todoId },
    });
  } catch (error: any) {
    if (error.code === 'P2025') {
      console.log(`NewTodo ${todoId} already deleted or doesn't exist`);
      revalidatePath('/board');
      return;
    }
    throw error;
  }

  revalidatePath('/board');
}

// ============================================
// WRAP FEEDBACK ACTIONS
// ============================================

export async function createWrapFeedback(
  documentId: string,
  type: 'worked' | 'sucked',
  text: string
) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  const maxFeedback = await prisma.l10WrapFeedback.findFirst({
    where: { documentId, type },
    orderBy: { orderIndex: 'desc' },
  });

  const feedback = await prisma.l10WrapFeedback.create({
    data: {
      documentId,
      type,
      text,
      orderIndex: (maxFeedback?.orderIndex ?? -1) + 1,
    },
  });

  revalidatePath('/board');
  return feedback;
}

export async function updateWrapFeedback(feedbackId: string, text: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  try {
    const feedback = await prisma.l10WrapFeedback.update({
      where: { id: feedbackId },
      data: { text },
    });

    revalidatePath('/board');
    return feedback;
  } catch (error: any) {
    if (error.code === 'P2025') {
      console.log(`WrapFeedback ${feedbackId} not found for update`);
      revalidatePath('/board');
      return null;
    }
    throw error;
  }
}

export async function deleteWrapFeedback(feedbackId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  try {
    await prisma.l10WrapFeedback.delete({
      where: { id: feedbackId },
    });
  } catch (error: any) {
    if (error.code === 'P2025') {
      console.log(`WrapFeedback ${feedbackId} already deleted or doesn't exist`);
      revalidatePath('/board');
      return;
    }
    throw error;
  }

  revalidatePath('/board');
}

// ============================================
// WRAP SCORE ACTIONS
// ============================================

export async function upsertWrapScore(
  documentId: string,
  userId: string,
  score: number
) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  const wrapScore = await prisma.l10WrapScore.upsert({
    where: {
      documentId_userId: { documentId, userId },
    },
    update: { score },
    create: {
      documentId,
      userId,
      score,
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });

  revalidatePath('/board');
  return wrapScore;
}

// ============================================
// PARKING LOT ACTIONS (Legacy per-document)
// ============================================

export async function createParkingLotItem(documentId: string, text: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  const maxItem = await prisma.l10ParkingLotItem.findFirst({
    where: { documentId },
    orderBy: { orderIndex: 'desc' },
  });

  const item = await prisma.l10ParkingLotItem.create({
    data: {
      documentId,
      text,
      orderIndex: (maxItem?.orderIndex ?? -1) + 1,
    },
  });

  revalidatePath('/board');
  return item;
}

export async function updateParkingLotItem(itemId: string, text: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  try {
    const item = await prisma.l10ParkingLotItem.update({
      where: { id: itemId },
      data: { text },
    });

    revalidatePath('/board');
    return item;
  } catch (error: any) {
    if (error.code === 'P2025') {
      console.log(`ParkingLotItem ${itemId} not found for update`);
      revalidatePath('/board');
      return null;
    }
    throw error;
  }
}

export async function deleteParkingLotItem(itemId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  try {
    await prisma.l10ParkingLotItem.delete({
      where: { id: itemId },
    });
  } catch (error: any) {
    if (error.code === 'P2025') {
      console.log(`ParkingLotItem ${itemId} already deleted or doesn't exist`);
      revalidatePath('/board');
      return;
    }
    throw error;
  }

  revalidatePath('/board');
}

export async function reorderParkingLotItems(
  documentId: string,
  itemIds: string[]
) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  await prisma.$transaction(
    itemIds.map((id, index) =>
      prisma.l10ParkingLotItem.update({
        where: { id },
        data: { orderIndex: index },
      })
    )
  );

  revalidatePath('/board');
}

// ============================================
// GLOBAL PARKING LOT ACTIONS (Shared across all documents)
// ============================================

export async function getGlobalParkingLotItems() {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  const items = await prisma.l10GlobalParkingLotItem.findMany({
    orderBy: { orderIndex: 'asc' },
  });

  return items;
}

export async function createGlobalParkingLotItem(text: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  const maxItem = await prisma.l10GlobalParkingLotItem.findFirst({
    orderBy: { orderIndex: 'desc' },
  });

  const item = await prisma.l10GlobalParkingLotItem.create({
    data: {
      text,
      orderIndex: (maxItem?.orderIndex ?? -1) + 1,
    },
  });

  revalidatePath('/board');
  return item;
}

export async function updateGlobalParkingLotItem(itemId: string, text: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  try {
    const item = await prisma.l10GlobalParkingLotItem.update({
      where: { id: itemId },
      data: { text },
    });

    revalidatePath('/board');
    return item;
  } catch (error: any) {
    if (error.code === 'P2025') {
      console.log(`GlobalParkingLotItem ${itemId} not found for update`);
      revalidatePath('/board');
      return null;
    }
    throw error;
  }
}

export async function deleteGlobalParkingLotItem(itemId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  try {
    await prisma.l10GlobalParkingLotItem.delete({
      where: { id: itemId },
    });
  } catch (error: any) {
    if (error.code === 'P2025') {
      console.log(`GlobalParkingLotItem ${itemId} already deleted or doesn't exist`);
      revalidatePath('/board');
      return;
    }
    throw error;
  }

  revalidatePath('/board');
}

export async function reorderGlobalParkingLotItems(itemIds: string[]) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  await prisma.$transaction(
    itemIds.map((id, index) =>
      prisma.l10GlobalParkingLotItem.update({
        where: { id },
        data: { orderIndex: index },
      })
    )
  );

  revalidatePath('/board');
}

// ============================================
// CARRY-FORWARD ACTIONS
// ============================================

export async function getPreviousMeetingTodos(folderId: string, currentDocumentId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  // Get the current document to find its meeting date
  const currentDoc = await prisma.l10Document.findUnique({
    where: { id: currentDocumentId },
    select: { meetingDate: true },
  });

  if (!currentDoc) return { document: null, todos: [] };

  // Find the most recent document before this one in the same folder
  const previousDoc = await prisma.l10Document.findFirst({
    where: {
      folderId,
      id: { not: currentDocumentId },
      meetingDate: { lt: currentDoc.meetingDate },
    },
    orderBy: { meetingDate: 'desc' },
    select: {
      id: true,
      title: true,
      meetingDate: true,
      weekNumber: true,
    },
  });

  if (!previousDoc) return { document: null, todos: [] };

  // Get the new todos from that document
  const todos = await prisma.l10NewTodo.findMany({
    where: { documentId: previousDoc.id },
    orderBy: { orderIndex: 'asc' },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });

  return { document: previousDoc, todos };
}

export async function carryForwardTodosFromPreviousMeeting(
  folderId: string,
  targetDocumentId: string,
  todoIds: string[]
) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  // Get the previous meeting's data
  const { document: previousDoc, todos: allTodos } = await getPreviousMeetingTodos(
    folderId,
    targetDocumentId
  );

  if (!previousDoc) throw new Error('No previous meeting found');

  // Filter to only the selected todos
  const selectedTodos = allTodos.filter((t) => todoIds.includes(t.id));

  // Get the max order index for last week todos in target document
  const maxTodo = await prisma.l10LastWeekTodo.findFirst({
    where: { documentId: targetDocumentId },
    orderBy: { orderIndex: 'desc' },
  });

  let orderIndex = (maxTodo?.orderIndex ?? -1) + 1;

  // Create as last week todos in the target document
  const createdTodos = await prisma.$transaction(
    selectedTodos.map((todo) =>
      prisma.l10LastWeekTodo.create({
        data: {
          documentId: targetDocumentId,
          userId: todo.userId,
          text: todo.text,
          isDone: false,
          orderIndex: orderIndex++,
        },
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      })
    )
  );

  revalidatePath('/board');
  return createdTodos;
}

export async function getPreviousMeetingRocks(folderId: string, currentDocumentId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  // Get the current document to find its meeting date
  const currentDoc = await prisma.l10Document.findUnique({
    where: { id: currentDocumentId },
    select: { meetingDate: true },
  });

  if (!currentDoc) return { document: null, rocks: [] };

  // Find the most recent document before this one in the same folder
  const previousDoc = await prisma.l10Document.findFirst({
    where: {
      folderId,
      id: { not: currentDocumentId },
      meetingDate: { lt: currentDoc.meetingDate },
    },
    orderBy: { meetingDate: 'desc' },
    select: {
      id: true,
      title: true,
      meetingDate: true,
      weekNumber: true,
    },
  });

  if (!previousDoc) return { document: null, rocks: [] };

  // Get the rocks from that document
  const rocks = await prisma.l10Rock.findMany({
    where: { documentId: previousDoc.id },
    orderBy: { orderIndex: 'asc' },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });

  return { document: previousDoc, rocks };
}

export async function carryForwardRocksFromPreviousMeeting(
  folderId: string,
  targetDocumentId: string,
  rockIds: string[]
) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  // Get the previous meeting's data
  const { document: previousDoc, rocks: allRocks } = await getPreviousMeetingRocks(
    folderId,
    targetDocumentId
  );

  if (!previousDoc) throw new Error('No previous meeting found');

  // Filter to only the selected rocks
  const selectedRocks = allRocks.filter((r) => rockIds.includes(r.id));

  // Get the max order index for rocks in target document
  const maxRock = await prisma.l10Rock.findFirst({
    where: { documentId: targetDocumentId },
    orderBy: { orderIndex: 'desc' },
  });

  let orderIndex = (maxRock?.orderIndex ?? -1) + 1;

  // Create as rocks in the target document (resetting status to on track)
  const createdRocks = await prisma.$transaction(
    selectedRocks.map((rock) =>
      prisma.l10Rock.create({
        data: {
          documentId: targetDocumentId,
          userId: rock.userId,
          title: rock.title,
          isOnTrack: true, // Reset to on track for new week
          orderIndex: orderIndex++,
        },
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      })
    )
  );

  revalidatePath('/board');
  return createdRocks;
}
