# Enterprise Production Setup Guide

## ✅ What's Been Upgraded

Your application is now **enterprise-ready** with the following improvements:

### 🔒 Security
- **Helmet.js**: Security headers to prevent XSS, clickjacking, etc.
- **Rate Limiting**: Prevents API abuse (100 req/15min general, 10 req/min for expensive operations)
- **Input Validation**: Zod schemas validate all requests
- **Authentication**: Optional/required auth middleware with Clerk integration
- **Authorization**: User resource ownership verification

### 📊 Monitoring & Logging
- **Winston Logger**: Structured logging with file rotation
- **Error Tracking**: Global error handler with stack traces
- **Request Logging**: All API requests logged with metadata

### 🚀 Deployment
- **Real Publishing**: Vercel API integration for actual deployments
- **Usage Tracking**: Token consumption monitoring
- **Subscription Management**: Track user limits and usage

### 🛡️ Middleware Stack
1. Helmet security headers
2. CORS configuration
3. Rate limiting
4. Request logging
5. Input validation
6. Authentication/Authorization
7. Error handling

---

## 🔧 Required Configuration

### 1. Environment Variables

Create `/Backend/.env` with:

```bash
# API Keys
CLAUDE_API_KEY=sk-ant-...your_key_here
CLAUDE_MODEL=claude-3-haiku-20240307

# Database (Required for production)
DATABASE_URL=postgresql://user:password@host:5432/database?pgbouncer=true

# Authentication (Clerk)
CLERK_SECRET_KEY=sk_live_...your_key_here
CLERK_PUBLISHABLE_KEY=pk_live_...your_key_here

# Deployment (For publishing functionality)
VERCEL_TOKEN=...your_vercel_api_token_here

# Server
PORT=3000
NODE_ENV=production
LOG_LEVEL=info
```

###  2. Get Your API Keys

#### Vercel API Token (For Publishing)
1. Go to https://vercel.com/account/tokens
2. Create new token with deployment permissions  
3. Add to `VERCEL_TOKEN` in `.env`

#### Clerk Keys (For Authentication)
1. Go to https://clerk.com
2. Create project
3. Copy `Secret Key` and `Publishable Key`
4. Add to Backend `.env` and Frontend `.env`

#### Claude API Key (AI)
1. Go to https://console.anthropic.com
2. Get API key
3. Add to `CLAUDE_API_KEY`

#### Database
1. Use Neon, Supabase, or any PostgreSQL provider
2. Get connection string
3. Add to `DATABASE_URL`

---

## 📦 Installation

```bash
# Backend
cd Backend
npm install
npx prisma generate
npx prisma db push  # Creates database tables

# Frontend  
cd ../Frontend
npm install
```

---

## 🏗️ Build & Deploy

### Local Development
```bash
# Backend
cd Backend
npm start

# Frontend (separate terminal)
cd Frontend
npm run dev
```

### Production Build
```bash
# Backend
cd Backend
npm run build
npm start

# Frontend
cd Frontend
npm run build
```

### Deploy to Vercel
```bash
# Deploy Frontend + Backend together
vercel --prod

# Or separate deployments:
cd Frontend && vercel --prod
cd ../Backend && vercel --prod
```

---

## 🔐 Database Setup

Run Prisma migrations:

```bash
cd Backend
npx prisma generate
npx prisma db push
```

This creates tables for:
- `User` - User accounts
- `Project` - Saved projects
- `Usage` - Token tracking
- `Subscription` - User limits
- `SavedPrompt` - Saved prompts

---

## 🧪 Testing the Setup

### 1. Test Health Endpoint
```bash
curl http://localhost:3000/
```

Should return:
```json
{
  "message": "AppiaV2 API is running!",
  "status": "healthy",
  "version": "2.0.0"
}
```

### 2. Test Usage Tracking
```bash
curl -X POST http://localhost:3000/api/usage \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test_user",
    "actionType": "chat_generation",
    "tokensUsed": 100
  }'
```

### 3. Test Publishing (requires VERCEL_TOKEN)
```bash
curl -X POST http://localhost:3000/api/publish \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test_user",
    "projectName": "test-app",
    "files": {
      "index.html": "<html><body>Hello World</body></html>"
    },
    "framework": "static"
  }'
```

---

## 📊 API Endpoints

### Health Check
- `GET /` - API status

### Chat & Generation  
- `POST /chat` - AI chat (rate limited: 10/min)

### Projects
- `GET /api/projects/:userId` - List user projects
- `POST /api/projects` - Create project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Usage Tracking
- `POST /api/usage` - Log token usage
- `GET /api/usage/:userId` - Get usage stats

### Publishing (NEW!)
- `POST /api/publish` - Deploy to Vercel
- `GET /api/publish/:deploymentId` - Get deployment status
- `DELETE /api/publish/:deploymentId` - Delete deployment

---

## 🚨 Security Considerations

### Rate Limits
- General API: 100 requests / 15 minutes
- Expensive operations (chat, publish): 10 requests / minute

### CORS
Configured for:
- https://appia-v2.vercel.app
- https://appia-v2-*.vercel.app
- http://localhost:5173
- http://localhost:3000

### Authentication
- Optional auth: Allows anonymous + authenticated users
- Required auth: Rejects unauthenticated requests
- Authorization: Verifies resource ownership

---

## 📝 Logs

Logs are written to:
- `Backend/logs/combined.log` - All logs
- `Backend/logs/error.log` - Errors only
- `Backend/logs/exceptions.log` - Unhandled exceptions
- `Backend/logs/rejections.log` - Unhandled promise rejections

In production, pipe these to a log aggregator (Datadog, LogRocket, etc.).

---

## 🎯 Next Steps

1. ✅ Set up all environment variables
2. ✅ Test locally
3. ✅ Run database migrations
4. ✅ Deploy to Vercel
5. ⚠️ Set up monitoring (Sentry, Datadog)
6. ⚠️ Configure CI/CD pipeline
7. ⚠️ Set up database backups
8. ⚠️ Configure CDN for static assets

---

## 🐛 Troubleshooting

### "VERCEL_TOKEN not configured"
- Add `VERCEL_TOKEN` to Backend `.env`
- Get token from vercel.com/account/tokens

### "Database connection failed"
- Check `DATABASE_URL` format
- Ensure database is accessible
- Run `npx prisma db push`

### "Rate limit exceeded"
- Wait 15 minutes or adjust limits in `src/index.ts`

### "Authentication required"
- Pass `Authorization: Bearer <token>` header
- Or ensure optional auth routes are used

---

## 📞 Support

For issues, check:
1. Logs in `Backend/logs/`
2. Browser console for frontend errors
3. API response error messages

Enterprise support: Set up Sentry, LogRocket, or similar monitoring.

---

**Your application is now production-ready! 🎉**
