# Database Migration Quick Start

## 🔍 Pre-Flight Check (Recommended First Step)

```bash
npm run migrate:preflight
```

This will verify:
- Environment variables are set
- All CSV files are present
- Dependencies are installed
- Scripts are ready

---

## 🚀 Run Migration (Choose One Method)

### Method 1: Using npm (Recommended)
```bash
npm run migrate:vercel
npm run migrate:verify
```

### Method 2: Using Shell Script
```bash
npm install csv-parse
chmod +x scripts/run-migration.sh
./scripts/run-migration.sh
npm run migrate:verify
```

### Method 3: Manual Steps
```bash
npm install csv-parse
npx prisma db push
node scripts/migrate-and-import.js
node scripts/verify-migration.js
```

---

## 📋 What Gets Migrated

| Table | Records |
|-------|---------|
| Users | 2 |
| Boards | 1 |
| Columns | 5 |
| Cards | 2 |
| Tasks | 2 |
| **Total** | **10** |

---

## ✅ Success Indicators

After running the migration, you should see:
- ✅ "Imported X users/boards/columns/cards/tasks"
- ✅ Row counts matching expected values
- ✅ Test queries succeeding
- ✅ "Migration completed successfully!"

---

## 🔍 Verify Migration

```bash
npm run migrate:verify
```

Or open Prisma Studio:
```bash
npm run db:studio
```

---

## 🆘 Troubleshooting

### "csv-parse module not found"
```bash
npm install csv-parse
```

### "Permission denied"
```bash
chmod +x scripts/run-migration.sh
```

### "Table already exists"
```bash
npx prisma db push --force-reset
npm run migrate:vercel
```

---

## 📚 Full Documentation

- **Detailed Guide**: `scripts/MIGRATION-README.md`
- **Complete Summary**: `MIGRATION-SUMMARY.md`

---

## ⏱️ Estimated Time

- Installation: 30 seconds
- Migration: 30 seconds
- Verification: 10 seconds
- **Total: ~1 minute**
