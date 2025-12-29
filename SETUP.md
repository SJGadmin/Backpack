# Backpack Setup Guide

Your Supabase project has been created! Follow these steps to complete the setup.

## ✅ Already Configured

- Project URL: `https://vosaxnvbohjzaxvmmytj.supabase.co`
- Anon Key: `sb_publishable_nok5QgDHRuLXv8cv1MeVpQ_0MnuYUvv`
- Database URL: `postgresql://postgres:[YOUR-PASSWORD]@db.vosaxnvbohjzaxvmmytj.supabase.co:5432/postgres`
- Session Secret: Generated ✓

## 🔑 Step 1: Get Missing Credentials

### Get your Service Role Key

1. Go to your Supabase project: https://vosaxnvbohjzaxvmmytj.supabase.co
2. Navigate to **Settings** → **API**
3. Scroll to **Project API keys**
4. Copy the **service_role** key (starts with `eyJ...`)
5. Update `.env` file - replace `YOUR_SERVICE_ROLE_KEY_HERE` with this key

### Get your Database Password

1. In Supabase, go to **Settings** → **Database**
2. Scroll to **Connection string**
3. Copy your password from the connection string
4. Update `.env` file - replace `[YOUR-PASSWORD]` in both `DATABASE_URL` and `DIRECT_URL`

## 📦 Step 2: Create Storage Bucket

1. In Supabase dashboard, go to **Storage**
2. Click **Create a new bucket**
3. Name it: `attachments`
4. Set it to **Public bucket** (check the box)
5. Click **Create bucket**

## 🗄️ Step 3: Set Up Database

Run these commands in order:

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Seed with initial data (users, board, columns)
npm run db:seed
```

This will create:
- Two users: `justin@stewartandjane.com` and `grant@stewartandjane.com`
- Password: `WhoisJane!59` (for both)
- One board: "Stewart & Jane Group"
- Five columns: Backlog, Next Up, In Progress, Waiting, Done

## 🚀 Step 4: Run Development Server

```bash
npm run dev
```

Open http://localhost:3000 and login with:
- Email: `justin@stewartandjane.com`
- Password: `WhoisJane!59`

## 🎉 You're Done!

The application should now be fully functional with:
- ✅ Kanban board with drag-and-drop
- ✅ Rich text editing
- ✅ Task checklists
- ✅ File attachments
- ✅ Comments with @mentions
- ✅ Calendar view
- ✅ Full-text search

## 🔧 Optional: Slack Integration

To enable Slack notifications:

1. Go to https://api.slack.com/apps
2. Click **Create New App** → **From scratch**
3. Name: "Backpack", select your workspace
4. Go to **Incoming Webhooks** → Toggle **Activate**
5. Click **Add New Webhook to Workspace**
6. Select channel (e.g., `#projects`)
7. Copy the Webhook URL
8. Update `.env` file: `SLACK_WEBHOOK_URL="https://hooks.slack.com/services/..."`
9. Restart the dev server

Now when you type `@Justin` or `@Grant` in comments, Slack will get notified!

## 🐛 Troubleshooting

### Database Connection Error
- Make sure you replaced `[YOUR-PASSWORD]` in both DATABASE_URL and DIRECT_URL
- Check that your IP is allowlisted in Supabase (Settings → Database → Connection pooling)

### File Upload Errors
- Verify the `attachments` bucket exists in Supabase Storage
- Make sure it's set to **Public**
- Confirm `SUPABASE_SERVICE_ROLE_KEY` is correct

### Can't Login
- Run `npm run db:seed` again to recreate users
- Clear browser cookies and try again

## 📚 Next Steps

See [README.md](README.md) for:
- Deployment to Vercel
- Database management commands
- Architecture details
- Full feature documentation
