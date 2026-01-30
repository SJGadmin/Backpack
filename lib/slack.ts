'use server';

import { prisma } from '@/lib/prisma';

const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

/**
 * Extracts @mentions from text by matching against all user names in the database.
 * Returns an array of user names that were mentioned.
 */
export async function extractMentions(text: string): Promise<string[]> {
  const users = await prisma.user.findMany({
    select: { name: true },
  });

  const mentions: string[] = [];
  const lowerText = text.toLowerCase();

  for (const user of users) {
    // Match @Name (case-insensitive)
    const mentionPattern = new RegExp(`@${user.name}`, 'gi');
    if (mentionPattern.test(text)) {
      mentions.push(user.name);
    }
  }

  return mentions;
}

/**
 * Sends a Slack notification when someone is mentioned in a comment.
 */
export async function sendCommentMentionNotification(
  cardTitle: string,
  cardId: string,
  commentText: string,
  mentionedUser: string,
  authorName: string
) {
  if (!SLACK_WEBHOOK_URL) {
    console.log('Slack webhook not configured, skipping notification');
    return;
  }

  try {
    const cardUrl = `${APP_URL}/board?card=${cardId}`;

    const message = {
      text: `@${mentionedUser} was mentioned in "${cardTitle}"`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*${authorName}* mentioned *@${mentionedUser}* in <${cardUrl}|${cardTitle}>`,
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `> ${commentText.substring(0, 200)}${commentText.length > 200 ? '...' : ''}`,
          },
        },
      ],
    };

    await fetch(SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    });
  } catch (error) {
    console.error('Failed to send Slack notification:', error);
  }
}

interface TodoForSlack {
  text: string;
  userName: string;
  dueDate: Date | null;
  isCompleted: boolean;
}

/**
 * Sends all new todos from an L10 meeting to Slack.
 */
export async function sendNewTodosToSlack(
  documentTitle: string,
  documentId: string,
  todos: TodoForSlack[]
) {
  if (!SLACK_WEBHOOK_URL) {
    console.log('Slack webhook not configured, skipping notification');
    return { success: false, error: 'Slack webhook not configured' };
  }

  if (todos.length === 0) {
    return { success: false, error: 'No todos to send' };
  }

  try {
    const docUrl = `${APP_URL}/board?l10=${documentId}`;

    // Group todos by user
    const todosByUser = todos.reduce(
      (acc, todo) => {
        if (!acc[todo.userName]) {
          acc[todo.userName] = [];
        }
        acc[todo.userName].push(todo);
        return acc;
      },
      {} as Record<string, TodoForSlack[]>
    );

    // Build the message blocks
    const blocks: any[] = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `New To-Dos from ${documentTitle}`,
          emoji: true,
        },
      },
      {
        type: 'divider',
      },
    ];

    // Add todos grouped by user
    for (const [userName, userTodos] of Object.entries(todosByUser)) {
      const todoLines = userTodos
        .map((todo) => {
          const status = todo.isCompleted ? '~' : '';
          const dueStr = todo.dueDate
            ? ` _(due ${new Date(todo.dueDate).toLocaleDateString()})_`
            : '';
          return `• ${status}${todo.text}${status}${dueStr}`;
        })
        .join('\n');

      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*${userName}*\n${todoLines}`,
        },
      });
    }

    // Add link to document
    blocks.push(
      {
        type: 'divider',
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `<${docUrl}|View in BackPack>`,
          },
        ],
      }
    );

    const message = {
      text: `New To-Dos from ${documentTitle}`,
      blocks,
    };

    const response = await fetch(SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      throw new Error(`Slack API error: ${response.status}`);
    }

    return { success: true };
  } catch (error) {
    console.error('Failed to send todos to Slack:', error);
    return { success: false, error: 'Failed to send to Slack' };
  }
}
