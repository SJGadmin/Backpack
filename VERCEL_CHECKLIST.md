# Vercel Deployment Checklist

## ✅ Immediate Actions Required

### 1. Verify Environment Variables in Vercel Dashboard

Go to: **Vercel Dashboard → Your Project → Settings → Environment Variables**

Check that these are set for **Production**, **Preview**, and **Development**:

#### Required Variables:
- [ ] `PRISMA_DATABASE_URL` - Your Prisma Accelerate URL
- [ ] `POSTGRES_URL` - Vercel Postgres connection string (auto-added)
- [ ] `BLOB_READ_WRITE_TOKEN` - Vercel Blob token (auto-added)
- [ ] `SESSION_SECRET` - 32-character random string
- [ ] `NEXT_PUBLIC_APP_URL` - Your production URL (e.g., https://backpack.vercel.app)

#### Optional Variables:
- [ ] `SLACK_WEBHOOK_URL` - If using Slack notifications

### 2. Delete Old Supabase Variables (If They Exist)

Remove these if present:
- [ ] ❌ Delete `NEXT_PUBLIC_SUPABASE_URL`
- [ ] ❌ Delete `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] ❌ Delete `SUPABASE_SERVICE_ROLE_KEY`

### 3. Monitor Current Deployment

The push I just made should trigger a new deployment. Watch for:

1. **Go to**: Vercel Dashboard → Deployments
2. **Latest deployment** should show "Building..."
3. **Check build logs** for:
   - ✅ `Removing node_modules and .next...`
   - ✅ `Installing @vercel/blob@2.0.0`
   - ❌ Should NOT see `@supabase/supabase-js`

### 4. If Build Still Fails

**Option A: Clear Cache Manually**
1. Go to failed deployment
2. Click three dots menu (···)
3. Select "Redeploy"
4. **Check** "Clear build cache"
5. Click "Redeploy"

**Option B: Force Rebuild (Nuclear)**
1. Settings → General → Scroll down
2. Click "Clear Build Cache" button
3. Manually trigger redeploy

**Option C: Delete and Recreate Project**
1. Delete Vercel project
2. Create new project from same GitHub repo
3. Reconnect Vercel Postgres and Blob Storage
4. Add environment variables
5. Deploy

## 🔍 Debugging Tips

### Check Build Logs For:

**Good signs:**
```
✓ Running "npm ci --legacy-peer-deps"
✓ Installing @vercel/blob@2.0.0
✓ Installing @prisma/client@7.2.0
✓ Compiled successfully
```

**Bad signs:**
```
❌ Installing @supabase/supabase-js
❌ Error: supabaseUrl is required
❌ Module not found: @supabase/supabase-js
```

### If You See Package Lock Conflicts:

The `npm ci` command requires `package-lock.json` to be in sync. If you see errors:

1. Locally run: `npm install`
2. Commit updated `package-lock.json`
3. Push again

## 📊 What Changed

### Before Migration:
- ❌ Supabase PostgreSQL
- ❌ Supabase Storage
- ❌ `@supabase/supabase-js` dependency

### After Migration:
- ✅ Vercel Postgres with Prisma
- ✅ Vercel Blob Storage
- ✅ `@vercel/blob` dependency
- ✅ All Supabase code removed

### The Problem:
Vercel's build cache still had `node_modules/@supabase/supabase-js` from before the migration, causing the deployment to fail even though the code was updated.

### The Solution:
Modified `vercel.json` to force deletion of `node_modules` and `.next` before each build, ensuring a clean environment.

## 🎯 Expected Result

After successful deployment:
1. ✅ Build completes without errors
2. ✅ App deploys successfully
3. ✅ Can access https://your-app.vercel.app
4. ✅ Can log in with existing users
5. ✅ Board loads with columns
6. ✅ Can create/edit/delete cards and tasks
7. ✅ File uploads work with Vercel Blob

## 🔄 Next Steps After First Successful Deploy

Once the deployment succeeds, you can revert `vercel.json` to normal:

```json
{
  "buildCommand": "npm run build",
  "installCommand": "npm install",
  "framework": "nextjs"
}
```

The forced cleanup is only needed once to clear the cache. After that, normal builds will work fine.
