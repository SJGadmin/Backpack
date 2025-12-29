# Database Connection Troubleshooting

## Current Error
`Can't reach database server` - This means your connection to Supabase is being blocked.

## Quick Fix Options

### Option 1: Disable Database Password Protection (Recommended for Development)

1. Go to your Supabase project: https://vosaxnvbohjzaxvmmytj.supabase.co
2. Navigate to **Settings** → **Database**
3. Scroll to **Database Password** section
4. Toggle **OFF** the "Enable database password" option
5. Try running `npm run db:push` again

### Option 2: Use Pooler Connection Strings

1. In Supabase, go to **Settings** → **Database**
2. Find the **Connection Pooler** section
3. Copy both connection strings:
   - **Transaction mode** (for DATABASE_URL with port 6543)
   - **Session mode** (for DIRECT_URL with port 5432)
4. Update your `.env` file with these strings

### Option 3: Allow Your IP Address

1. Find your IP address: Visit https://whatismyipaddress.com/
2. In Supabase, go to **Settings** → **Database**
3. Scroll to **Connection pooling** section
4. Click **Add IP address**
5. Paste your IP and save
6. Try `npm run db:push` again

### Option 4: Use Direct Connection String

1. In Supabase **Settings** → **Database**
2. Look for **Connection string** section
3. Switch to the **URI** tab
4. Copy the connection string (should look like):
   ```
   postgresql://postgres.vosaxnvbohjzaxvmmytj:[PASSWORD]@aws-0-us-west-1.pooler.supabase.com:6543/postgres
   ```
5. Update both `DATABASE_URL` and `DIRECT_URL` in your `.env` file

## Testing Connection

After making changes, test the connection:

```bash
npm run db:push
```

If successful, you'll see:
```
✔ Your database is now in sync with your Prisma schema.
```

Then seed the database:
```bash
npm run db:seed
```

## Still Having Issues?

Make sure:
- ✅ Password is correct in `.env` file
- ✅ Project ID is correct: `vosaxnvbohjzaxvmmytj`
- ✅ No firewall blocking port 5432 or 6543
- ✅ You're connected to the internet
