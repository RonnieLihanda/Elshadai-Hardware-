# Supabase Edge Functions - Quick Start

## 🚀 Deploy in 5 Minutes

### 1. Install Supabase CLI

```bash
npm install -g supabase
```

### 2. Login and Link Project

```bash
supabase login
cd "e:\Antigravity\Elshadai Musembe"
supabase link --project-ref vphdxmxcwbpkvppytrjn
```

### 3. Set Secrets

```bash
supabase secrets set DB_HOSTNAME=db.vphdxmxcwbpkvppytrjn.supabase.co
supabase secrets set DB_PORT=6543
supabase secrets set DB_USER=postgres.vphdxmxcwbpkvppytrjn
supabase secrets set DB_PASSWORD=GodsPlan1234!
supabase secrets set DB_NAME=postgres
supabase secrets set JWT_SECRET=elshadai_secret_key_2026
```

### 4. Deploy

```bash
supabase functions deploy
```

### 5. Update Frontend

In `frontend/.env`:

```env
VITE_API_URL=https://vphdxmxcwbpkvppytrjn.supabase.co/functions/v1
```

## 📋 API Endpoints

| Function | URL |
|----------|-----|
| Login | `POST /auth-login` |
| Get User | `GET /auth-me` |
| Products | `GET/POST/PUT/DELETE /products` |
| Sales | `GET/POST /sales` |
| Dashboard | `GET /dashboard?action=stats` |
| Customers | `GET /customers` |
| Users | `GET /users` |
| Receipts | `GET /receipts` |

## 🧪 Test

```bash
curl -X POST https://vphdxmxcwbpkvppytrjn.supabase.co/functions/v1/auth-login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"yourpassword"}'
```

## 📊 Monitor

```bash
# View logs
supabase functions logs --follow

# Check status
supabase functions list
```

## ⚡ Local Development

```bash
# Start Supabase locally
supabase start

# Serve functions
supabase functions serve

# Test locally
curl http://localhost:54321/functions/v1/auth-login
```

## 🔧 Common Commands

```bash
# Deploy single function
supabase functions deploy auth-login

# Delete function
supabase functions delete function-name

# List secrets
supabase secrets list

# Unset secret
supabase secrets unset SECRET_NAME
```

That's it! 🎉
