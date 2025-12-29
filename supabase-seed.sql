-- Backpack Seed Data
-- Run this AFTER running supabase-schema.sql

-- Password hash for "WhoisJane!59"
-- Generated with bcrypt cost factor 10

-- Insert users (password: WhoisJane!59)
INSERT INTO "User" (id, email, password, name, "createdAt", "updatedAt")
VALUES
    ('user_justin', 'justin@stewartandjane.com', '$2b$10$cOUBK0TOUSVjSa1v04gXQOgHBV.r0j.qpyPSnM9LBFarwa/gRUyZa', 'Justin', NOW(), NOW()),
    ('user_grant', 'grant@stewartandjane.com', '$2b$10$cOUBK0TOUSVjSa1v04gXQOgHBV.r0j.qpyPSnM9LBFarwa/gRUyZa', 'Grant', NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

-- Insert board
INSERT INTO "Board" (id, name, description, "createdAt", "updatedAt")
VALUES ('main-board', 'Stewart & Jane Group', 'Project management board for Stewart & Jane', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert columns
INSERT INTO "Column" (id, "boardId", name, "orderIndex", "createdAt", "updatedAt")
VALUES
    ('main-board-backlog', 'main-board', 'Backlog', 0, NOW(), NOW()),
    ('main-board-next-up', 'main-board', 'Next Up', 1, NOW(), NOW()),
    ('main-board-in-progress', 'main-board', 'In Progress', 2, NOW(), NOW()),
    ('main-board-waiting', 'main-board', 'Waiting', 3, NOW(), NOW()),
    ('main-board-done', 'main-board', 'Done', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert sample card
INSERT INTO "Card" (id, "columnId", title, description, "descriptionPlain", "orderIndex", "createdById", "createdAt", "updatedAt")
VALUES (
    'welcome-card',
    'main-board-backlog',
    'Welcome to Backpack',
    '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"This is your first project card. Click to edit and add details, tasks, attachments, and comments."}]}]}',
    'This is your first project card. Click to edit and add details, tasks, attachments, and comments.',
    0,
    'user_justin',
    NOW(),
    NOW()
)
ON CONFLICT (id) DO NOTHING;
