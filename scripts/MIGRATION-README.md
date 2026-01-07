# Database Migration Guide: Supabase to Vercel Postgres

This guide will help you migrate your Backpack application database from Supabase to Vercel Postgres.

## Prerequisites

- Node.js and npm installed
- Vercel Postgres database credentials in your `.env` file
- CSV export files in the `prisma-vercel/` directory

## Migration Steps

### Step 1: Install Required Dependencies

First, install the CSV parsing library:

```bash
npm install csv-parse
```

### Step 2: Make the Shell Script Executable

```bash
chmod +x scripts/run-migration.sh
```

### Step 3: Run the Migration

You have two options:

#### Option A: Run the Complete Migration Script (Recommended)

This will push the schema and import all data in one go:

```bash
./scripts/run-migration.sh
```

#### Option B: Run Steps Manually

If you prefer to run each step manually:

1. **Push the Prisma schema to Vercel Postgres:**
   ```bash
   npx prisma db push
   ```

2. **Import the CSV data:**
   ```bash
   node scripts/migrate-and-import.js
   ```

## What the Migration Script Does

1. **Schema Migration**: Pushes your Prisma schema to create all database tables
2. **Data Import**: Imports data from CSV files in this order:
   - User_rows.csv (2 users)
   - Board_rows.csv (1 board)
   - Column_rows.csv (5 columns)
   - Card_rows.csv (2 cards)
   - Task_rows.csv (2 tasks)
3. **Verification**: Checks row counts to ensure all data was imported
4. **Testing**: Runs basic queries to verify database functionality

## Expected Output

The migration script will display:
- Import progress for each table
- Final row counts for verification
- Sample queries showing the data is accessible

Example output:
```
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
✅ Query Test 2: Fetched board with columns
✅ Query Test 3: Fetched cards with tasks

🎉 Migration and import completed successfully!
```

## Troubleshooting

### Error: "csv-parse module not found"
Run: `npm install csv-parse`

### Error: "Permission denied: ./scripts/run-migration.sh"
Run: `chmod +x scripts/run-migration.sh`

### Error: "Table already exists"
If you've already run the migration, you may need to reset the database first. You can do this by:
1. Dropping all tables in Vercel Postgres dashboard, OR
2. Running: `npx prisma db push --force-reset` (WARNING: This deletes all data)

### Error: "Connection refused" or "Database not found"
Check that your `.env` file has the correct `PRISMA_DATABASE_URL` and `POSTGRES_URL` values.

## Verifying the Migration

After migration, you can:

1. **Use Prisma Studio** to browse your data:
   ```bash
   npx prisma studio
   ```

2. **Check the application** by running the dev server:
   ```bash
   npm run dev
   ```

3. **Run a quick query** in the Node.js REPL:
   ```bash
   node
   ```
   Then:
   ```javascript
   const { PrismaClient } = require('@prisma/client');
   const prisma = new PrismaClient();
   prisma.user.findMany().then(console.log);
   ```

## Next Steps

After successful migration:
1. Update your application to use the new Vercel Postgres database
2. Test all application features thoroughly
3. Remove or archive the old Supabase configuration
4. Update your deployment configuration to use Vercel Postgres

## Files Created

- `scripts/migrate-and-import.js` - Main migration script
- `scripts/run-migration.sh` - Shell script to run complete migration
- `scripts/MIGRATION-README.md` - This documentation file
