# URGENT: Vercel Deployment Fix

## The Real Issue

The error `supabaseUrl is required` is coming from **Vercel's cached `node_modules`** directory. Even though we removed `@supabase/supabase-js` from `package.json`, Vercel is still using a cached version of `node_modules` that includes it.

## What I Just Did

1. ✅ Removed `supabase-schema.sql` and `supabase-seed.sql` from git (these were still tracked)
2. ✅ Created `clean-build.sh` that forcibly deletes `node_modules` and `.next` before building
3. ✅ Updated `vercel.json` to use this clean build script
4. ✅ Pushed changes to trigger new deployment

## Critical Next Steps - DO THIS IN VERCEL DASHBOARD

### Option 1: Clear Build Cache (TRY THIS FIRST)

1. Go to **Vercel Dashboard** → Your Project → **Deployments**
2. Find the **latest failed deployment**
3. Click the **three dots (···)** menu
4. Select **"Redeploy"**
5. **✅ CHECK THE BOX**: "Clear build cache"
6. Click **"Redeploy"**

This should work now because:
- The new `clean-build.sh` will run
- It will forcibly delete `node_modules` and `.next`
- Fresh `npm ci` will install ONLY packages from `package-lock.json`
- No Supabase packages will be installed

### Option 2: Manual Cache Clear

1. **Settings** → **General**
2. Scroll to **"Build & Development Settings"**
3. Click **"Clear Build Cache"** button
4. Go back to **Deployments** and click **"Redeploy"** on latest

### Option 3: Nuclear Option (If Nothing Else Works)

**Delete the entire Vercel project and recreate it:**

1. **Settings** → **General** → Scroll to bottom
2. Click **"Delete Project"** (scary but effective)
3. Go to Vercel dashboard and click **"Add New Project"**
4. Import your GitHub repo again
5. **Connect Vercel Postgres**:
   - Storage → Connect Store → Postgres
   - Use existing database
6. **Connect Vercel Blob**:
   - Storage → Connect Store → Blob
   - Use existing storage
7. **Add Environment Variables**:
   ```
   PRISMA_DATABASE_URL = prisma+postgres://accelerate.prisma-data.net/...
   SESSION_SECRET = your-32-char-secret
   NEXT_PUBLIC_APP_URL = https://your-app.vercel.app
   ```
   (Vercel will auto-add POSTGRES_URL and BLOB_READ_WRITE_TOKEN)

8. Deploy

## Why This Keeps Happening

Vercel's build system caches aggressively:

```
┌─ First build (with Supabase)
│  └─ Cached: node_modules/@supabase/supabase-js ✅
│
├─ You update package.json (remove Supabase)
│  └─ Git: package.json updated ✅
│  └─ Vercel cache: STILL HAS node_modules/@supabase ❌
│
└─ Build fails because:
   - package.json doesn't list @supabase/supabase-js
   - But node_modules still has it (from cache)
   - Some compiled code tries to import it
   - Error: "supabaseUrl is required"
```

## The Solution

Our `clean-build.sh` script now does this:

```bash
rm -rf node_modules    # Delete cache
rm -rf .next          # Delete compiled code
npm ci                # Clean install from package-lock.json
npx prisma generate   # Generate Prisma client
npm run build         # Build Next.js
```

This **forces** Vercel to install fresh dependencies.

## How to Verify It Worked

Watch the build logs in Vercel. You should see:

```
✅ 🧹 Cleaning build artifacts...
✅ Cleaned node_modules and .next
✅ 📦 Installing dependencies...
✅ Dependencies installed
✅ Installing @vercel/blob@2.0.0
❌ NO @supabase/supabase-js
✅ Build succeeded
```

If you see `Installing @supabase/supabase-js`, the cache wasn't cleared.

## Package Lock Issue

If you see errors about `package-lock.json` not matching `package.json`:

1. Locally run: `npm install`
2. Commit the updated `package-lock.json`
3. Push again

## Still Failing?

If it's still failing after all this:

1. **Check Vercel Environment Variables** - Make sure no Supabase vars exist
2. **Check Build Logs** - Look for which file is importing Supabase
3. **Try Nuclear Option** - Delete and recreate project (see Option 3 above)

The nuclear option is the most reliable because it gives you a 100% fresh build environment with zero cached files.
