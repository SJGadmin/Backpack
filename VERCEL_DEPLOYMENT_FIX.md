# Vercel Deployment Fix - Supabase URL Error

## Problem
Vercel deployment fails with error: `supabaseUrl is required`

This happens because **Vercel's build cache still contains the old `@supabase/supabase-js` dependency** from before the migration.

## Solution Steps

### 1. Clear Vercel Build Cache

In your Vercel dashboard:

1. Go to your project settings
2. Navigate to **Settings → General**
3. Scroll down to **Build & Development Settings**
4. Click **Clear Build Cache** button

OR use this faster method:

1. Go to your latest deployment that failed
2. Click the **three dots menu (···)** on the deployment
3. Select **Redeploy**
4. **IMPORTANT:** Check the box "Clear build cache"
5. Click **Redeploy**

### 2. Verify Environment Variables

Make sure these are set in **Vercel → Settings → Environment Variables**:

Required for Production:
```
PRISMA_DATABASE_URL=prisma+postgres://accelerate.prisma-data.net/?api_key=...
POSTGRES_URL=postgres://...@db.prisma.io:5432/postgres?sslmode=require
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...
SESSION_SECRET=your-random-32-char-string
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

Optional:
```
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
```

**NOTE:** Vercel automatically provides these when you connect Vercel Postgres and Blob:
- `BLOB_READ_WRITE_TOKEN` (automatically set when Blob Storage is connected)
- `POSTGRES_URL` (automatically set when Vercel Postgres is connected)

You need to manually add:
- `PRISMA_DATABASE_URL` (from Prisma Accelerate)
- `SESSION_SECRET` (generate a random 32-character string)
- `NEXT_PUBLIC_APP_URL` (your production URL)

### 3. Delete Old Supabase Environment Variables

In **Vercel → Settings → Environment Variables**, delete these if they exist:
- ❌ `NEXT_PUBLIC_SUPABASE_URL`
- ❌ `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- ❌ `SUPABASE_SERVICE_ROLE_KEY`

### 4. Force Reinstall Dependencies

Add this to your `vercel.json` to force a clean install:

```json
{
  "buildCommand": "rm -rf node_modules && npm install && npm run build",
  "installCommand": "npm install",
  "framework": "nextjs"
}
```

This is temporary - you can revert it after the first successful deployment.

### 5. Trigger Deployment

After clearing cache and verifying env vars:

```bash
git commit --allow-empty -m "Force Vercel rebuild"
git push
```

## Why This Happens

When you migrate from one package to another:
1. Local `.next` cache gets cleared manually ✅
2. Local `node_modules` gets updated ✅
3. **Vercel's remote build cache** still has old files ❌

Vercel caches:
- `node_modules/` dependencies
- `.next/` build output
- Turbopack compilation cache

The old `@supabase/supabase-js` package is still in Vercel's cached `node_modules`, causing the error.

## Verification

After redeployment, check:
1. Build logs show `npm install` installing `@vercel/blob@2.0.0`
2. Build logs show NO `@supabase/supabase-js`
3. Deployment succeeds
4. App loads without "supabaseUrl" error

## Alternative: Nuclear Option

If clearing cache doesn't work:

1. Delete the Vercel project entirely
2. Create a new Vercel project
3. Connect to the same GitHub repo
4. Reconnect Vercel Postgres and Blob Storage
5. Add environment variables
6. Deploy

This guarantees a completely fresh build environment.
