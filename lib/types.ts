import { Prisma } from '@prisma/client';

export type UserInfo = {
  id: string;
  name: string;
  email: string;
};

export type Task = Prisma.TaskGetPayload<{
  include: {
    assignedTo: {
      select: { id: true; name: true; email: true };
    };
    createdBy: {
      select: { id: true; name: true; email: true };
    };
  };
}>;

export type Comment = Prisma.CommentGetPayload<{
  include: {
    createdBy: {
      select: { id: true; name: true; email: true };
    };
  };
}>;

export type Attachment = Prisma.AttachmentGetPayload<{}>;

export type Link = Prisma.LinkGetPayload<{}>;

export type Card = Prisma.CardGetPayload<{
  include: {
    createdBy: {
      select: { id: true; name: true; email: true };
    };
    tasks: {
      include: {
        assignedTo: {
          select: { id: true; name: true; email: true };
        };
      };
    };
    comments: {
      include: {
        createdBy: {
          select: { id: true; name: true; email: true };
        };
      };
    };
    attachments: true;
    links: true;
  };
}>;

export type Column = Prisma.ColumnGetPayload<{
  include: {
    cards: {
      include: {
        createdBy: {
          select: { id: true; name: true; email: true };
        };
        tasks: {
          include: {
            assignedTo: {
              select: { id: true; name: true; email: true };
            };
          };
        };
        comments: {
          include: {
            createdBy: {
              select: { id: true; name: true; email: true };
            };
          };
        };
        attachments: true;
        links: true;
      };
    };
  };
}>;

export type Board = Prisma.BoardGetPayload<{
  include: {
    columns: {
      include: {
        cards: {
          include: {
            createdBy: {
              select: { id: true; name: true; email: true };
            };
            tasks: {
              include: {
                assignedTo: {
                  select: { id: true; name: true; email: true };
                };
              };
            };
            comments: {
              include: {
                createdBy: {
                  select: { id: true; name: true; email: true };
                };
              };
            };
            attachments: true;
            links: true;
          };
        };
      };
    };
  };
}>;

// ============================================
// L10 Meeting Notes Types
// ============================================

export type L10FolderWithCount = Prisma.L10FolderGetPayload<{}> & {
  _count: { documents: number };
};

export type L10Folder = Prisma.L10FolderGetPayload<{
  include: {
    documents: {
      select: { id: true; title: true; meetingDate: true; weekNumber: true };
    };
  };
}>;

export type L10DocumentSummary = Prisma.L10DocumentGetPayload<{
  select: {
    id: true;
    title: true;
    meetingDate: true;
    weekNumber: true;
    createdAt: true;
    updatedAt: true;
  };
}>;

export type L10SegueEntry = Prisma.L10SegueEntryGetPayload<{
  include: {
    user: { select: { id: true; name: true; email: true } };
  };
}>;

export type L10ScorecardMetric = Prisma.L10ScorecardMetricGetPayload<{}>;

export type L10ScorecardRow = Prisma.L10ScorecardRowGetPayload<{
  include: {
    metric: true;
  };
}>;

export type L10Rock = Prisma.L10RockGetPayload<{
  include: {
    user: { select: { id: true; name: true; email: true } };
  };
}>;

export type L10LastWeekTodo = Prisma.L10LastWeekTodoGetPayload<{
  include: {
    user: { select: { id: true; name: true; email: true } };
  };
}>;

export type L10IdsIssue = Prisma.L10IdsIssueGetPayload<{
  include: {
    owner: { select: { id: true; name: true; email: true } };
  };
}>;

export type L10NewTodo = Prisma.L10NewTodoGetPayload<{
  include: {
    user: { select: { id: true; name: true; email: true } };
  };
}>;

export type L10WrapFeedback = Prisma.L10WrapFeedbackGetPayload<{}>;

export type L10WrapScore = Prisma.L10WrapScoreGetPayload<{
  include: {
    user: { select: { id: true; name: true; email: true } };
  };
}>;

export type L10ParkingLotItem = Prisma.L10ParkingLotItemGetPayload<{}>;

export type L10GlobalParkingLotItem = Prisma.L10GlobalParkingLotItemGetPayload<{}>;

export type L10Document = Prisma.L10DocumentGetPayload<{
  include: {
    folder: true;
    segueEntries: {
      include: { user: { select: { id: true; name: true; email: true } } };
    };
    scorecardRows: {
      include: { metric: true };
    };
    rocks: {
      include: { user: { select: { id: true; name: true; email: true } } };
    };
    lastWeekTodos: {
      include: { user: { select: { id: true; name: true; email: true } } };
    };
    idsIssues: {
      include: { owner: { select: { id: true; name: true; email: true } } };
    };
    newTodos: {
      include: { user: { select: { id: true; name: true; email: true } } };
    };
    wrapFeedback: true;
    wrapScores: {
      include: { user: { select: { id: true; name: true; email: true } } };
    };
    parkingLotItems: true;
  };
}>;
