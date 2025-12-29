-- Backpack Database Schema
-- Run this in Supabase SQL Editor

-- Create User table
CREATE TABLE IF NOT EXISTS "User" (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create Board table
CREATE TABLE IF NOT EXISTS "Board" (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create Column table
CREATE TABLE IF NOT EXISTS "Column" (
    id TEXT PRIMARY KEY,
    "boardId" TEXT NOT NULL,
    name TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("boardId") REFERENCES "Board"(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "Column_boardId_orderIndex_idx" ON "Column"("boardId", "orderIndex");

-- Create Card table
CREATE TABLE IF NOT EXISTS "Card" (
    id TEXT PRIMARY KEY,
    "columnId" TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    "descriptionPlain" TEXT,
    "dueDate" TIMESTAMP(3),
    "orderIndex" INTEGER NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "searchVector" TEXT,
    FOREIGN KEY ("columnId") REFERENCES "Column"(id) ON DELETE CASCADE,
    FOREIGN KEY ("createdById") REFERENCES "User"(id)
);

CREATE INDEX IF NOT EXISTS "Card_columnId_orderIndex_idx" ON "Card"("columnId", "orderIndex");
CREATE INDEX IF NOT EXISTS "Card_createdById_idx" ON "Card"("createdById");
CREATE INDEX IF NOT EXISTS "Card_dueDate_idx" ON "Card"("dueDate");

-- Create CardCustomField table
CREATE TABLE IF NOT EXISTS "CardCustomField" (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    "fieldType" TEXT NOT NULL,
    options TEXT,
    "orderIndex" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "CardCustomField_orderIndex_idx" ON "CardCustomField"("orderIndex");

-- Create CardCustomFieldValue table
CREATE TABLE IF NOT EXISTS "CardCustomFieldValue" (
    id TEXT PRIMARY KEY,
    "cardId" TEXT NOT NULL,
    "fieldId" TEXT NOT NULL,
    value TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("cardId") REFERENCES "Card"(id) ON DELETE CASCADE,
    FOREIGN KEY ("fieldId") REFERENCES "CardCustomField"(id) ON DELETE CASCADE,
    UNIQUE ("cardId", "fieldId")
);

CREATE INDEX IF NOT EXISTS "CardCustomFieldValue_cardId_idx" ON "CardCustomFieldValue"("cardId");
CREATE INDEX IF NOT EXISTS "CardCustomFieldValue_fieldId_idx" ON "CardCustomFieldValue"("fieldId");

-- Create Task table
CREATE TABLE IF NOT EXISTS "Task" (
    id TEXT PRIMARY KEY,
    "cardId" TEXT NOT NULL,
    text TEXT NOT NULL,
    completed BOOLEAN NOT NULL DEFAULT false,
    "dueDate" TIMESTAMP(3),
    "assignedToId" TEXT,
    "createdById" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("cardId") REFERENCES "Card"(id) ON DELETE CASCADE,
    FOREIGN KEY ("createdById") REFERENCES "User"(id),
    FOREIGN KEY ("assignedToId") REFERENCES "User"(id)
);

CREATE INDEX IF NOT EXISTS "Task_cardId_orderIndex_idx" ON "Task"("cardId", "orderIndex");
CREATE INDEX IF NOT EXISTS "Task_assignedToId_idx" ON "Task"("assignedToId");
CREATE INDEX IF NOT EXISTS "Task_dueDate_idx" ON "Task"("dueDate");

-- Create Comment table
CREATE TABLE IF NOT EXISTS "Comment" (
    id TEXT PRIMARY KEY,
    "cardId" TEXT NOT NULL,
    text TEXT NOT NULL,
    "textPlain" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("cardId") REFERENCES "Card"(id) ON DELETE CASCADE,
    FOREIGN KEY ("createdById") REFERENCES "User"(id)
);

CREATE INDEX IF NOT EXISTS "Comment_cardId_idx" ON "Comment"("cardId");
CREATE INDEX IF NOT EXISTS "Comment_createdById_idx" ON "Comment"("createdById");

-- Create Attachment table
CREATE TABLE IF NOT EXISTS "Attachment" (
    id TEXT PRIMARY KEY,
    "cardId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("cardId") REFERENCES "Card"(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "Attachment_cardId_idx" ON "Attachment"("cardId");
