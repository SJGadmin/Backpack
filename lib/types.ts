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
          };
        };
      };
    };
  };
}>;
