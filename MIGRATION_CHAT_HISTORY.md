# Database Migration: Add Chat History

## ⚠️ IMPORTANT: Run This Migration First!

Before the chat history persistence feature will work, you need to add the `chat_history` column to your existing `projects` table.

## Option 1: Vercel Postgres Dashboard (Recommended)

1. Go to your Vercel dashboard: https://vercel.com/dashboard
2. Navigate to your project → Storage → Postgres
3. Click "Query" tab
4. Run this SQL:

```sql
ALTER TABLE projects ADD COLUMN IF NOT EXISTS chat_history JSONB DEFAULT '[]';
```

5. Click "Run Query"

## Option 2: Using Vercel CLI

```bash
# Install Vercel CLI if you haven't
npm i -g vercel

# Login
vercel login

# Connect to your database
vercel env pull

# Then use any Postgres client with the connection string
```

## Option 3: Using psql

```bash
# Get your connection string from Vercel dashboard
psql "your-postgres-connection-string"

# Then run:
ALTER TABLE projects ADD COLUMN IF NOT EXISTS chat_history JSONB DEFAULT '[]';
```

## Verify Migration

After running the migration, verify it worked:

```sql
-- Check if column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'projects' AND column_name = 'chat_history';

-- Should return: chat_history | jsonb
```

## What This Does

- Adds a new `chat_history` column to store conversation messages as JSON
- Sets default value to empty array `[]` for existing projects
- Allows NULL values (won't break existing projects)
- Uses JSONB for efficient storage and querying

## Testing After Migration

1. Create a new project in the builder
2. Chat with AI multiple times
3. Check the browser console - you should see: "✅ Project auto-saved to database with chat history"
4. Go to `/projects` page
5. Click on your project
6. Check console for: "📂 Loading saved project" and "💬 Loaded X messages from chat history"
7. Continue chatting - AI should remember the previous conversation!

## Troubleshooting

### If projects still don't load with chat history:

1. **Check API logs in Vercel:**
   - Go to Vercel dashboard → Your project → Deployments → Latest → Functions
   - Look for `[ProjectsAPI]` logs
   - Should show `chat_history` in the query results

2. **Check browser console:**
   - Open DevTools (F12)
   - Look for the emoji logs when opening a project
   - Should see: "💬 Loaded X messages from chat history"

3. **Verify database column:**
   ```sql
   SELECT id, name, 
          CASE 
            WHEN chat_history IS NULL THEN 'NULL'
            WHEN chat_history = '[]'::jsonb THEN 'EMPTY'
            ELSE 'HAS DATA'
          END as chat_status
   FROM projects;
   ```

## Rolling Back (If Needed)

If you need to remove the column:

```sql
ALTER TABLE projects DROP COLUMN IF EXISTS chat_history;
```

**Note:** This will delete all stored chat histories permanently!
