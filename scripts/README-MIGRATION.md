# Complete Database Migration Guide

**From:** Supabase
**To:** Vercel Postgres (with Prisma Accelerate)
**Date Prepared:** January 7, 2026

---

## Table of Contents

1. [Overview](#overview)
2. [What's Included](#whats-included)
3. [Prerequisites](#prerequisites)
4. [Quick Start](#quick-start)
5. [Detailed Steps](#detailed-steps)
6. [Verification](#verification)
7. [Troubleshooting](#troubleshooting)
8. [Post-Migration](#post-migration)

---

## Overview

This migration toolkit provides everything needed to migrate your Backpack Kanban PM application database from Supabase to Vercel Postgres. The migration includes:

- **Schema deployment** via Prisma
- **Data import** from CSV files
- **Relationship validation**
- **Automated verification**

**Migration Size:**
- 5 tables (User, Board, Column, Card, Task)
- 10 total records
- Estimated time: < 2 minutes

---

## What's Included

### Scripts

| File | Purpose | Size |
|------|---------|------|
| `preflight-check.js` | Pre-migration validation | 5.6 KB |
| `migrate-and-import.js` | Main data import script | 6.5 KB |
| `verify-migration.js` | Post-migration verification | 4.8 KB |
| `run-migration.sh` | Shell orchestrator | 591 B |

### Documentation

| File | Purpose |
|------|---------|
| `MIGRATION-README.md` | Detailed migration guide |
| `README-MIGRATION.md` | This comprehensive guide |

### Data Files

Located in `../prisma-vercel/`:
- `User_rows.csv` (2 records)
- `Board_rows.csv` (1 record)
- `Column_rows.csv` (5 records)
- `Card_rows.csv` (2 records)
- `Task_rows.csv` (2 records)

### npm Scripts

Added to `package.json`:
```json
{
  "migrate:preflight": "Pre-flight checks",
  "migrate:vercel": "Run complete migration",
  "migrate:verify": "Verify migration success"
}
```

---

## Prerequisites

### Required

1. **Node.js and npm** installed
2. **Vercel Postgres database** created
3. **Environment variables** configured in `.env`:
   - `PRISMA_DATABASE_URL` (Prisma Accelerate URL)
   - `POSTGRES_URL` (Direct database URL)

### Dependencies

The `csv-parse` package is already included in `package.json`. If needed:
```bash
npm install
```

---

## Quick Start

### Step 1: Pre-Flight Check

Verify everything is ready:
```bash
npm run migrate:preflight
```

Expected output:
```
🔍 Pre-Flight Migration Checklist
================================

✅ PASSED:
   ✓ Environment variables configured
   ✓ Prisma schema found
   ✓ All 5 CSV files present
   ✓ node_modules directory exists
   ✓ Prisma Client generated
   ✓ csv-parse module installed
   ✓ All 3 migration scripts present
   ✓ run-migration.sh is executable

🎉 All checks passed! You are ready to run the migration.
```

### Step 2: Run Migration

```bash
npm run migrate:vercel
```

This will:
1. Push Prisma schema to Vercel Postgres
2. Import all CSV data in dependency order
3. Display progress and row counts

### Step 3: Verify Success

```bash
npm run migrate:verify
```

This will:
1. Count rows in each table
2. Test all relationships
3. Check for orphaned records
4. Run sample queries

---

## Detailed Steps

### Option A: Automated Migration (Recommended)

```bash
# 1. Check prerequisites
npm run migrate:preflight

# 2. Run migration
npm run migrate:vercel

# 3. Verify
npm run migrate:verify

# 4. Open Prisma Studio to browse data
npm run db:studio
```

### Option B: Using Shell Script

```bash
# Make executable (first time only)
chmod +x scripts/run-migration.sh

# Run migration
./scripts/run-migration.sh

# Verify
npm run migrate:verify
```

### Option C: Manual Step-by-Step

```bash
# 1. Generate Prisma Client
npx prisma generate

# 2. Push schema
npx prisma db push

# 3. Import data
node scripts/migrate-and-import.js

# 4. Verify
node scripts/verify-migration.js
```

---

## Expected Output

### During Migration

```
🚀 Starting database migration and data import...

📥 Importing Users...
✅ Imported 2 users

📥 Importing Boards...
✅ Imported 1 boards

📥 Importing Columns...
✅ Imported 5 columns

📥 Importing Cards...
✅ Imported 2 cards

📥 Importing Tasks...
✅ Imported 2 tasks

🔍 Verifying data import...

📊 Database Row Counts:
   Users:   2
   Boards:  1
   Columns: 5
   Cards:   2
   Tasks:   2

🧪 Testing basic queries...

✅ Query Test 1: Fetched all users
   Users: [ { id: 'user_grant', name: 'Grant', email: 'grant@...' }, ... ]

✅ Query Test 2: Fetched board with columns
   Board: Stewart & Jane Group
   Columns: Backlog, Next Up, In Progress, Waiting, Done

✅ Query Test 3: Fetched cards with tasks
   Card: "Complete PM Software" by Grant - 2 tasks
   Card: "Welcome to Backpack" by Justin - 0 tasks

🎉 Migration and import completed successfully!
```

### During Verification

```
🔍 Database Migration Verification
================================

📊 Current Database Row Counts:
   Users:       2
   Boards:      1
   Columns:     5
   Cards:       2
   Tasks:       2
   Comments:    0
   Attachments: 0

✅ Expected vs Actual:
   ✅ users: expected 2, got 2
   ✅ boards: expected 1, got 1
   ✅ columns: expected 5, got 5
   ✅ cards: expected 2, got 2
   ✅ tasks: expected 2, got 2

🧪 Running Relationship Tests:

✅ Test 1: User-Card Relationship
   Grant: created 1 cards
   Justin: created 1 cards

✅ Test 2: Board-Column-Card Hierarchy
   Board: Stewart & Jane Group
      → Column: Backlog (2 cards)
      → Column: Next Up (0 cards)
      → Column: In Progress (0 cards)
      → Column: Waiting (0 cards)
      → Column: Done (0 cards)

✅ Test 3: Card-Task Relationship
   Card: "Complete PM Software"
      Column: Backlog
      Created by: Grant
      Tasks: 2
         ○ Begin road map and outline
         ○ begin

   Card: "Welcome to Backpack"
      Column: Backlog
      Created by: Justin
      Tasks: 0

✅ Test 4: Checking for Orphaned Records
   Orphaned cards: ✅ None
   Orphaned tasks: ✅ None

================================
🎉 Migration verification PASSED!
   Your database is ready to use.
```

---

## Verification

### Automated Verification

```bash
npm run migrate:verify
```

### Manual Verification

#### 1. Using Prisma Studio
```bash
npm run db:studio
```
Opens browser at `http://localhost:5555`

#### 2. Using Node REPL
```bash
node
```
Then:
```javascript
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Check user count
prisma.user.count().then(console.log);

// Fetch all boards with columns
prisma.board.findMany({ include: { columns: true } }).then(console.log);

// Disconnect
prisma.$disconnect();
```

#### 3. Direct Database Query
Use your Vercel Postgres dashboard to run:
```sql
SELECT 'Users' as table_name, COUNT(*) as count FROM "User"
UNION ALL
SELECT 'Boards', COUNT(*) FROM "Board"
UNION ALL
SELECT 'Columns', COUNT(*) FROM "Column"
UNION ALL
SELECT 'Cards', COUNT(*) FROM "Card"
UNION ALL
SELECT 'Tasks', COUNT(*) FROM "Task";
```

---

## Troubleshooting

### Pre-Flight Check Fails

#### "csv-parse module not found"
```bash
npm install csv-parse
```

#### "Prisma Client not generated"
```bash
npx prisma generate
```

#### "run-migration.sh not executable"
```bash
chmod +x scripts/run-migration.sh
```

### Migration Errors

#### "Table already exists"
If you need to start fresh:
```bash
npx prisma db push --force-reset
npm run migrate:vercel
```
⚠️ **Warning:** This deletes all existing data!

#### "Connection refused" or "Database not found"
1. Check `.env` file has correct `PRISMA_DATABASE_URL` and `POSTGRES_URL`
2. Verify Vercel Postgres database is active
3. Test connection:
   ```bash
   npx prisma db execute --stdin <<< "SELECT 1;"
   ```

#### "Foreign key constraint failed"
The script imports data in dependency order. If this error occurs:
1. Check CSV files have correct IDs
2. Verify relationships in CSV data
3. Run with `--force-reset` to start clean

### Verification Warnings

#### Row count mismatch
- Check CSV files for correct data
- Look for import errors in migration output
- Re-run migration if needed

#### Orphaned records found
- Usually indicates data integrity issue in CSV files
- Check foreign key references in CSV data
- Re-export data from Supabase if needed

---

## Post-Migration

### 1. Test Application

```bash
npm run dev
```

Access application at `http://localhost:3000` and verify:
- [ ] Users can log in
- [ ] Board displays correctly
- [ ] Columns are in correct order
- [ ] Cards appear in correct columns
- [ ] Tasks display on cards
- [ ] All relationships work

### 2. Update Application Config

If everything works:
1. Update production environment variables
2. Deploy to Vercel
3. Test production deployment

### 3. Cleanup (Optional)

Once migration is verified successful:
- Archive Supabase connection strings
- Document migration date
- Update team documentation

### 4. Keep or Remove Migration Scripts

**Option A: Keep Scripts**
- Useful for future reference
- Can re-run if needed
- Keep in `scripts/` directory

**Option B: Archive Scripts**
- Move to `archive/` directory
- Keep documentation only
- Remove from active codebase

---

## Data Structure

### Users (2 records)
- `user_grant` - Grant (grant@stewartandjane.com)
- `user_justin` - Justin (justin@stewartandjane.com)

### Boards (1 record)
- `main-board` - Stewart & Jane Group

### Columns (5 records)
- Backlog (order: 0)
- Next Up (order: 1)
- In Progress (order: 2)
- Waiting (order: 3)
- Done (order: 4)

### Cards (2 records)
- "Welcome to Backpack" (in Backlog, by Justin)
- "Complete PM Software" (in Backlog, by Grant)

### Tasks (2 records)
- "Begin road map and outline" (on "Complete PM Software")
- "begin" (on "Complete PM Software")

---

## Technical Notes

### Import Order
The migration respects foreign key dependencies:
1. **Users** (no dependencies)
2. **Boards** (no dependencies)
3. **Columns** (depends on Boards)
4. **Cards** (depends on Columns and Users)
5. **Tasks** (depends on Cards and Users)

### Data Type Handling
- **Dates:** Parsed from ISO strings to Date objects
- **Booleans:** Converted from string literals to boolean
- **Nulls:** Empty strings converted to null
- **JSON:** Rich text stored as JSON strings

### Error Handling
- Each table import is wrapped in try-catch
- Errors are logged with context
- Migration stops on first error
- Can be safely re-run after fixing issues

---

## Support

If you encounter issues not covered in this guide:

1. **Check logs** - Migration script provides detailed error messages
2. **Review CSV files** - Ensure data integrity
3. **Verify environment** - Check `.env` configuration
4. **Test connection** - Use Prisma Studio to verify database access
5. **Re-run migration** - Safe to run multiple times with `--force-reset`

---

## Checklist

Use this checklist to track your migration:

- [ ] Pre-flight check passed
- [ ] Migration script executed successfully
- [ ] Verification script passed all tests
- [ ] Prisma Studio shows correct data
- [ ] Application runs with new database
- [ ] All features tested
- [ ] Production deployed (if applicable)
- [ ] Team notified
- [ ] Documentation updated
- [ ] Old Supabase config archived

---

**Migration prepared by:** Claude Sonnet 4.5
**Toolkit version:** 1.0
**Last updated:** January 7, 2026
