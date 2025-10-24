# Database Setup Guide

## Overview

This project uses PostgreSQL with Prisma ORM for data management. The database is **optional** - the app works without it, but with limited features.

## Database Schema

The app uses the following tables:

### 1. **users**
- Stores user information
- Links to projects, saved prompts

### 2. **projects**
- Stores generated projects
- Contains code, files (JSON), and metadata

### 3. **saved_prompts**
- User's saved prompt templates

### 4. **usage**
- Tracks token usage per user
- Used for rate limiting and analytics

### 5. **subscriptions**
- Manages user subscription tiers
- Tracks token limits and usage

## Setup Instructions

### Option 1: Vercel Postgres (Recommended)

1. **Create Vercel Postgres Database**
   ```bash
   # In your Vercel project dashboard
   # Go to Storage → Create Database → Postgres
   ```

2. **Get Connection Strings**
   - Vercel provides both pooled and direct URLs
   - Copy both `POSTGRES_URL` and `POSTGRES_URL_NON_POOLING`

3. **Add to Vercel Environment Variables**
   ```
   POSTGRES_URL=postgres://...
   POSTGRES_URL_NON_POOLING=postgres://...
   ```

4. **Run Prisma Migration**
   ```bash
   # Generate Prisma Client
   npx prisma generate
   
   # Push schema to database
   npx prisma db push
   ```

### Option 2: Other PostgreSQL Provider

Compatible with:
- Supabase
- Neon
- Railway
- PlanetScale
- Self-hosted PostgreSQL

**Steps:**
1. Create a PostgreSQL database
2. Get connection string
3. Add to `.env`:
   ```
   POSTGRES_URL=postgresql://user:password@host:port/database
   POSTGRES_URL_NON_POOLING=postgresql://user:password@host:port/database
   ```
4. Run migrations:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

## Verifying Database Connection

### 1. Check Tables Created

```bash
npx prisma studio
```

This opens a web interface to view your database tables.

### 2. Test Connection

Create a test file `test-db.js`:

```javascript
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Testing database connection...');
  
  // Try to count users
  const userCount = await prisma.user.count();
  console.log(`✅ Connected! Users in database: ${userCount}`);
  
  // Try to count usage records
  const usageCount = await prisma.usage.count();
  console.log(`✅ Usage records: ${usageCount}`);
}

main()
  .catch((e) => {
    console.error('❌ Database error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

Run:
```bash
node test-db.js
```

## Usage Tracking

The app tracks token usage in two places:

### 1. Frontend Display
- Shows remaining tokens in chat rail
- Updates after each AI response
- Stored in local state (not persistent)

### 2. Backend Tracking (if database configured)
- Records in `usage` table
- Links to user ID
- Includes metadata (input/output tokens, model)

**API Endpoint:** `/api/usage`

Example usage record:
```json
{
  "userId": "user_123",
  "actionType": "chat_generation",
  "tokensUsed": 500,
  "metadata": {
    "inputTokens": 100,
    "outputTokens": 400,
    "model": "claude-3-haiku-20240307"
  }
}
```

## Schema Management

### View Current Schema
```bash
npx prisma db pull
```

### Reset Database (⚠️ Deletes all data)
```bash
npx prisma db push --force-reset
```

### Generate Prisma Client
```bash
npx prisma generate
```

## Common Issues

### Issue: "Can't reach database server"
**Solution:** Check your `POSTGRES_URL` is correct and the database is accessible.

### Issue: "Table doesn't exist"
**Solution:** Run `npx prisma db push` to create tables.

### Issue: "P1001: Can't connect to database"
**Solution:** 
1. Check firewall settings
2. Verify connection string format
3. Ensure database is running

### Issue: App works but no data is saved
**Solution:** This is expected if `POSTGRES_URL` is not configured. The app works without a database but won't persist data.

## Production Deployment

### Vercel Configuration

1. **Environment Variables** (in Vercel dashboard):
   ```
   POSTGRES_URL=<your_pooled_connection_string>
   POSTGRES_URL_NON_POOLING=<your_direct_connection_string>
   ```

2. **Build Settings**:
   - Build Command: `npm run build` (already includes prisma generate)
   - Output Directory: `Frontend/dist`

3. **Post-Deployment**:
   The database schema is automatically pushed during build.

## Monitoring

### Check Usage Stats

```bash
# Run Prisma Studio
npx prisma studio

# Navigate to "usage" table
# View records sorted by createdAt
```

### Query Usage via API

If you have direct database access:

```sql
SELECT 
  userId, 
  SUM(tokensUsed) as total_tokens,
  COUNT(*) as requests
FROM usage
WHERE createdAt >= NOW() - INTERVAL '1 day'
GROUP BY userId;
```

## Migration from Old Schema

If you had a previous database setup:

```bash
# Backup old data
npx prisma db pull

# Apply new schema
npx prisma db push --force-reset

# Manually migrate data if needed
```

## Summary

✅ **Required for:**
- Token usage persistence
- User data storage
- Project saving
- Subscription management

❌ **NOT required for:**
- Basic AI chat functionality
- Preview generation
- Code editing

The app gracefully handles missing database configuration and continues to work with core features.
