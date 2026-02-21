# Supabase Edge Functions Deployment Guide

## Overview

Your Elshadai POS backend has been migrated from Express.js (Vercel) to Supabase Edge Functions (Deno runtime). This provides:
- ✅ Direct, fast access to your existing Supabase PostgreSQL database
- ✅ Global CDN distribution
- ✅ Automatic scaling
- ✅ Built-in authentication and environment variables
- ✅ Lower latency (Edge Functions run close to users)

## Prerequisites

1. **Supabase Account**: Sign up at https://supabase.com
2. **Supabase CLI**: Install globally
   ```bash
   npm install -g supabase
   ```
3. **Deno** (optional for local testing): https://deno.land/#installation

## Edge Functions Created

| Function | Endpoint | Methods | Description |
|----------|----------|---------|-------------|
| `auth-login` | `/auth-login` | POST | User login and JWT generation |
| `auth-me` | `/auth-me` | GET | Get current user info |
| `products` | `/products` | GET, POST, PUT, DELETE | Product CRUD operations |
| `sales` | `/sales` | GET, POST | Sales transactions |
| `dashboard` | `/dashboard` | GET | Dashboard statistics |
| `customers` | `/customers` | GET | Customer management |
| `users` | `/users` | GET, PUT | User management |
| `receipts` | `/receipts` | GET | Receipt retrieval |

## Deployment Steps

### 1. Login to Supabase CLI

```bash
supabase login
```

This will open your browser for authentication.

### 2. Link Your Supabase Project

If you already have a Supabase project:

```bash
cd "e:\Antigravity\Elshadai Musembe"
supabase link --project-ref your-project-ref
```

Or create a new project:

```bash
supabase projects create elshadai-pos
```

### 3. Set Environment Variables

Set your environment variables in the Supabase dashboard or using CLI:

```bash
# Get your project ref from dashboard URL
PROJECT_REF="your-project-ref"

# Set database connection variables
supabase secrets set DB_HOSTNAME=db.$PROJECT_REF.supabase.co
supabase secrets set DB_PORT=5432
supabase secrets set DB_USER=postgres
supabase secrets set DB_PASSWORD=your-database-password
supabase secrets set DB_NAME=postgres

# Set JWT secret
supabase secrets set JWT_SECRET=elshadai_secret_key_2026

# Optional: Email configuration
supabase secrets set EMAIL_USER=your-email@gmail.com
supabase secrets set EMAIL_APP_PASSWORD=your-app-password
supabase secrets set ADMIN_EMAIL=ronnielk21@gmail.com
```

### 4. Deploy All Edge Functions

Deploy all functions at once:

```bash
cd "e:\Antigravity\Elshadai Musembe"
supabase functions deploy
```

Or deploy individually:

```bash
supabase functions deploy auth-login
supabase functions deploy auth-me
supabase functions deploy products
supabase functions deploy sales
supabase functions deploy dashboard
supabase functions deploy customers
supabase functions deploy users
supabase functions deploy receipts
```

### 5. Get Your Edge Functions URL

After deployment, your Edge Functions will be available at:

```
https://{PROJECT_REF}.supabase.co/functions/v1/{function-name}
```

Example:
```
https://vphdxmxcwbpkvppytrjn.supabase.co/functions/v1/auth-login
https://vphdxmxcwbpkvppytrjn.supabase.co/functions/v1/products
```

## Testing Edge Functions

### Test Login

```bash
curl -X POST https://your-project-ref.supabase.co/functions/v1/auth-login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "your-password"
  }'
```

### Test Products (with auth)

```bash
# Get the token from login response first
TOKEN="your-jwt-token"

curl https://your-project-ref.supabase.co/functions/v1/products \
  -H "Authorization: Bearer $TOKEN"
```

## Local Development

### 1. Start Supabase Locally

```bash
supabase start
```

This starts local Supabase services including:
- PostgreSQL
- Edge Functions runtime
- Studio UI

### 2. Serve Edge Functions Locally

```bash
supabase functions serve
```

Your functions will be available at:
```
http://localhost:54321/functions/v1/{function-name}
```

### 3. Test Locally

```bash
curl -X POST http://localhost:54321/functions/v1/auth-login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "your-password"
  }'
```

## Frontend Configuration

### Update Frontend Environment Variables

Update [frontend/.env](frontend/.env):

```env
# Replace with your Supabase project ref
VITE_API_URL=https://your-project-ref.supabase.co/functions/v1
```

### API Endpoint Mapping

| Old Express Route | New Edge Function Endpoint |
|-------------------|----------------------------|
| `/api/auth/login` | `/functions/v1/auth-login` |
| `/api/auth/me` | `/functions/v1/auth-me` |
| `/api/products` | `/functions/v1/products` |
| `/api/products/search` | `/functions/v1/products?q=query` |
| `/api/sales` | `/functions/v1/sales` |
| `/api/dashboard/stats` | `/functions/v1/dashboard?action=stats` |
| `/api/customers` | `/functions/v1/customers` |
| `/api/users` | `/functions/v1/users` |
| `/api/receipts` | `/functions/v1/receipts` |

## Monitoring and Logs

### View Function Logs

```bash
# View logs for specific function
supabase functions logs auth-login

# Follow logs in real-time
supabase functions logs auth-login --follow
```

### Supabase Dashboard

Monitor your Edge Functions in the Supabase Dashboard:
1. Go to https://supabase.com/dashboard
2. Select your project
3. Navigate to "Edge Functions" in the sidebar

## Database Access

Your Edge Functions have direct access to your PostgreSQL database. The connection is automatically managed using the environment variables you set.

**Connection Details** (already configured in Edge Functions):
- Host: `db.{PROJECT_REF}.supabase.co`
- Port: `5432`
- User: `postgres`
- Database: `postgres`
- SSL: Enabled

## Troubleshooting

### Function Invocation Errors

```bash
# Check function logs
supabase functions logs function-name

# Verify environment variables
supabase secrets list
```

### Database Connection Issues

1. Verify `DB_PASSWORD` is correct
2. Check Supabase project status in dashboard
3. Ensure database is not paused (free tier auto-pauses after inactivity)

### CORS Issues

CORS is configured in `_shared/cors.ts`. To restrict origins, update:

```typescript
export const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://your-frontend-domain.com',
  // ...
};
```

## Performance Optimization

### Connection Pooling

Edge Functions use ephemeral connections. Each function creates and closes its own database connection. Supabase handles connection pooling on their end.

### Cold Starts

First invocation after inactivity may be slower (cold start). Subsequent calls are fast.

## Security Best Practices

1. **JWT Secret**: Use a strong, unique secret in production
2. **Environment Variables**: Never commit secrets to version control
3. **CORS**: Restrict origins to your frontend domain in production
4. **Database**: Use Supabase Row Level Security (RLS) policies
5. **Rate Limiting**: Configure in Supabase dashboard

## Next Steps

1. ✅ Deploy all Edge Functions
2. ✅ Update frontend `.env` with new API URL
3. ✅ Test all endpoints
4. ✅ Configure CORS for production
5. ✅ Set up monitoring and alerts
6. ✅ Remove Vercel deployment (backend folder)

## Cost

Supabase Edge Functions pricing (as of 2026):
- **Free Tier**: 500,000 invocations/month
- **Pro Tier**: $25/month + usage-based

## Support

- Supabase Docs: https://supabase.com/docs/guides/functions
- Deno Docs: https://deno.land/manual
- Community: https://github.com/supabase/supabase/discussions

---

**Migration Complete!** 🎉

Your backend is now running on Supabase Edge Functions with direct database access.
