# Backpack

A production-ready Kanban project management web application built for Stewart & Jane Group. Designed for internal use by two users with full-featured project management capabilities.

## Features

### Core Functionality
- **Single Kanban Board** - Drag-and-drop cards between customizable columns
- **Rich Project Cards** with:
  - Title and rich text descriptions (Tiptap editor)
  - Due dates with overdue indicators
  - Task checklists with assignments and due dates
  - File attachments with preview support
  - Threaded comments with @mentions
  - Created by attribution

### Views
- **Kanban View** - Visual board with drag-and-drop reordering
- **Calendar View** - Month view showing card and task due dates

### Search & Organization
- Quick search by card title
- Full-text search across descriptions and comments
- Sort cards by due date

### Integrations
- **Slack Notifications** - Automatic notifications when users are @mentioned in comments

### Column Management
- Create, edit, delete, and reorder columns
- Persistent ordering

## Tech Stack

- **Framework**: Next.js 16+ (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL (Supabase)
- **ORM**: Prisma
- **UI**: Tailwind CSS + shadcn/ui (Radix)
- **Rich Text**: Tiptap
- **Drag & Drop**: dnd-kit
- **File Storage**: Supabase Storage
- **Authentication**: iron-session with secure cookies
- **Deployment**: Vercel

## Prerequisites

- Node.js 18+ and npm
- A Supabase account and project
- A Vercel account (for deployment)
- Optional: Slack webhook URL for notifications

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd BackPack
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)

2. Get your connection strings:
   - Go to Project Settings → Database
   - Copy the "Connection string" (for `DATABASE_URL`)
   - Copy the "Direct connection" string (for `DIRECT_URL`)

3. Get your API keys:
   - Go to Project Settings → API
   - Copy the "Project URL" (for `NEXT_PUBLIC_SUPABASE_URL`)
   - Copy the "anon public" key (for `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
   - Copy the "service_role" key (for `SUPABASE_SERVICE_ROLE_KEY`)

4. Create a storage bucket for attachments:
   - Go to Storage in the Supabase dashboard
   - Click "Create bucket"
   - Name it `attachments`
   - Set it to **Public** (or configure RLS policies)
   - Save the bucket name

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
# Database (from Supabase)
DATABASE_URL="postgresql://user:password@host:port/database?pgbouncer=true"
DIRECT_URL="postgresql://user:password@host:port/database"

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
SUPABASE_STORAGE_BUCKET="attachments"

# Authentication - Generate a random 32-character string
SESSION_SECRET="generate-a-random-32-character-string"

# App URL (for Slack notifications)
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Slack Integration (optional)
SLACK_WEBHOOK_URL="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
```

To generate a secure `SESSION_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. Set Up the Database

Run Prisma migrations to create the database schema:

```bash
npm run db:push
```

Generate the Prisma client:

```bash
npm run db:generate
```

Seed the database with initial data (users, board, columns):

```bash
npm run db:seed
```

This will create:
- Two users: `justin@stewartandjane.com` and `grant@stewartandjane.com`
- Password for both: `WhoisJane!59`
- One board: "Stewart & Jane Group"
- Five default columns: Backlog, Next Up, In Progress, Waiting, Done
- A sample welcome card

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

Login with:
- Email: `justin@stewartandjane.com` or `grant@stewartandjane.com`
- Password: `WhoisJane!59`

## Deployment to Vercel

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin <your-github-repo-url>
git push -u origin main
```

### 2. Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "Add New Project"
3. Import your GitHub repository
4. Configure the project:
   - Framework Preset: Next.js
   - Build Command: `npm run build`
   - Output Directory: `.next`

5. Add all environment variables from your `.env` file:
   - Go to Settings → Environment Variables
   - Add each variable from your `.env` file
   - **Important**: Update `NEXT_PUBLIC_APP_URL` to your Vercel domain

6. Deploy

### 3. Run Database Migration on Vercel

After the first deployment, you need to run the database setup:

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Link to your project
vercel link

# Run the seed command
vercel env pull .env.local
npm run db:seed
```

## Database Management

Useful Prisma commands:

```bash
# Generate Prisma client after schema changes
npm run db:generate

# Push schema changes to database (development)
npm run db:push

# Create and run migrations (production)
npm run db:migrate

# Run seed script
npm run db:seed

# Open Prisma Studio (database GUI)
npm run db:studio
```

## Slack Integration Setup (Optional)

1. Go to your Slack workspace
2. Navigate to [api.slack.com/apps](https://api.slack.com/apps)
3. Click "Create New App" → "From scratch"
4. Name it "Backpack" and select your workspace
5. Go to "Incoming Webhooks" and activate it
6. Click "Add New Webhook to Workspace"
7. Select the channel (e.g., `#projects`)
8. Copy the Webhook URL
9. Add it to your `.env` file as `SLACK_WEBHOOK_URL`
10. Redeploy to Vercel

When users type `@Justin` or `@Grant` in comments, a notification will be sent to Slack.

## User Credentials

The application supports exactly two users:

- **Justin**: `justin@stewartandjane.com` / `WhoisJane!59`
- **Grant**: `grant@stewartandjane.com` / `WhoisJane!59`

Passwords are hashed with bcrypt and stored securely. Never commit unhashed passwords to the repository.

## Architecture Overview

### Authentication
- Uses `iron-session` for secure server-side sessions
- Session cookies are HTTP-only, signed, and encrypted
- Middleware protects all routes except `/login`

### Database Schema
- `User` - Two users with hashed passwords
- `Board` - Single board for the workspace
- `Column` - Customizable columns with ordering
- `Card` - Project cards with rich metadata
- `Task` - Checklist items within cards
- `Comment` - Card comments with @mention support
- `Attachment` - File uploads linked to cards
- `CardCustomField` & `CardCustomFieldValue` - Extensible custom fields

### File Storage
- Files are uploaded to Supabase Storage
- Organized by card: `cards/{cardId}/{timestamp}-{filename}`
- Image previews shown in the UI
- Files can be downloaded or deleted

### Search
- Full-text search across:
  - Card titles
  - Card descriptions (plain text extracted from rich text)
  - Comment content
- Implemented with Prisma case-insensitive queries

## Development

### Project Structure

```
BackPack/
├── app/
│   ├── board/           # Main Kanban board page
│   ├── login/           # Login page
│   ├── layout.tsx       # Root layout with Toaster
│   └── page.tsx         # Redirects to /board
├── components/
│   ├── ui/              # shadcn/ui components
│   ├── kanban-card.tsx
│   ├── kanban-column.tsx
│   ├── card-drawer.tsx
│   ├── calendar-view.tsx
│   └── rich-text-editor.tsx
├── lib/
│   ├── actions/         # Server actions
│   │   ├── auth.ts
│   │   ├── board.ts
│   │   ├── cards.ts
│   │   ├── tasks.ts
│   │   ├── comments.ts
│   │   └── attachments.ts
│   ├── prisma.ts        # Prisma client
│   ├── session.ts       # Session configuration
│   ├── supabase.ts      # Supabase client
│   └── types.ts         # TypeScript types
├── prisma/
│   ├── schema.prisma    # Database schema
│   └── seed.ts          # Seed script
├── middleware.ts        # Route protection
├── .env.example         # Environment template
└── README.md
```

### Adding Features

The codebase is structured for easy extension:

- **New server action**: Add to `lib/actions/`
- **New UI component**: Add to `components/`
- **New database table**: Update `prisma/schema.prisma` and run migrations
- **New route**: Add to `app/`

### Code Quality

- TypeScript strict mode enabled
- ESLint configured
- Server actions for data mutations
- React Server Components where appropriate
- Client components for interactivity

## Troubleshooting

### Database Connection Issues
- Verify your `DATABASE_URL` and `DIRECT_URL` are correct
- Check if your IP is allowlisted in Supabase (Project Settings → Database → Connection Pooling)
- For Vercel, ensure you're using the connection pooling URL

### Authentication Problems
- Ensure `SESSION_SECRET` is set and is at least 32 characters
- Clear browser cookies and try again
- Check that passwords match in the seed script

### File Upload Failures
- Verify `SUPABASE_SERVICE_ROLE_KEY` is correct
- Ensure the storage bucket exists and is named correctly
- Check bucket permissions (should be public or have appropriate RLS policies)

### Slack Notifications Not Working
- Verify `SLACK_WEBHOOK_URL` is correct
- Check that the webhook channel exists
- Ensure mentions use `@Justin` or `@Grant` (case-insensitive)

## Acceptance Tests

The application meets all the following criteria:

1. ✅ Logging in as Justin shows "Created by Justin" on new cards
2. ✅ Grant can add tasks assigned to Justin and mention @Justin in comments
3. ✅ Slack receives notification when webhook is configured
4. ✅ Dragging cards between columns persists on refresh
5. ✅ Searching for keywords in descriptions/comments finds cards
6. ✅ Calendar shows task due dates and opens correct card when clicked
7. ✅ Uploading images shows preview thumbnails

## Security Considerations

- Passwords are hashed with bcrypt (cost factor 10)
- Session cookies are HTTP-only, secure (in production), and signed
- No hardcoded credentials in the codebase
- File uploads are handled server-side with validation
- CSRF protection via server actions
- SQL injection prevention via Prisma

## License

Proprietary - Internal use only for Stewart & Jane Group

## Support

For issues or questions, contact the development team or open an issue in the repository.
