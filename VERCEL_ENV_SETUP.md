# Vercel Environment Variables Setup

## CRITICAL: Missing Environment Variables

Your app is not working because Vercel is missing these environment variables:

### 1. Add Frontend Clerk Key

Go to: https://vercel.com/diegos-projects-d88486d0/appia-v2/settings/environment-variables

Add this variable:

```
Name: VITE_CLERK_PUBLISHABLE_KEY
Value: pk_test_bmW4dC1vZXVOWk2XYtHzEuV2x1cm...
```

**Use the same value as your `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`**

### 2. Add Database URL (for user tracking)

```
Name: POSTGRES_URL
Value: postgres://...your-database-url...
```

You already have `APPIAV2_POSTGRES_URL` - use that value OR connect your Prisma database.

### 3. After adding these:

1. Click "Save"
2. Go to Deployments tab
3. Click "..." on latest deployment
4. Click "Redeploy"

## Why These Are Needed:

- **VITE_CLERK_PUBLISHABLE_KEY**: Frontend can't authenticate users without this
  - Result: User shows as "anonymous"
  - Result: Token tracking doesn't work
  - Result: Projects don't save

- **POSTGRES_URL**: Backend can't save user data without database
  - Result: "Database not configured" message
  - Result: Usage not tracked per user
  - Result: Projects not saved

## Quick Fix Command:

Run this in Vercel CLI (if you have it installed):

```bash
vercel env add VITE_CLERK_PUBLISHABLE_KEY
# Paste your pk_test_... key when prompted

vercel env add POSTGRES_URL  
# Paste your database URL when prompted

vercel --prod
```

## Current Status:

- ✅ Clerk integrated in Vercel
- ✅ API keys configured
- ❌ Frontend environment variable MISSING
- ❌ Database URL not configured
- ❌ Users show as "anonymous"
- ❌ Files not persisting
