# Deploy Frontend to Cloudflare Pages

This guide will help you deploy the Elshadai POS frontend to Cloudflare Pages (replacing Vercel).

## Prerequisites

- A Cloudflare account (free): https://dash.cloudflare.com/sign-up
- GitHub repository (already have it)

## Step-by-Step Deployment

### 1. Create Cloudflare Pages Project

1. Go to https://dash.cloudflare.com
2. Click **Pages** in the left sidebar
3. Click **Create a project**
4. Click **Connect to Git**
5. Authorize Cloudflare to access your GitHub account
6. Select your repository: **Elshadai-Hardware-**
7. Click **Begin setup**

### 2. Configure Build Settings

On the setup page, configure the following:

- **Project name**: `elshadai-pos` (or any name you prefer)
- **Production branch**: `main`
- **Framework preset**: Choose **Vite** from dropdown
- **Build command**: `cd frontend && npm install && npm run build`
- **Build output directory**: `frontend/dist`
- **Root directory**: `/` (leave as root)

### 3. Environment Variables

Click **Add environment variable** and add these:

**Variable 1:**
- Name: `VITE_API_URL`
- Value: `https://vphdxmxcwbpkvppytrjn.supabase.co/functions/v1`

**Variable 2:**
- Name: `VITE_SUPABASE_ANON_KEY`
- Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwaGR4bXhjd2Jwa3ZwcHl0cmpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzNTgxNjUsImV4cCI6MjA4NjkzNDE2NX0.OFDdro1YVAY3hY1JJBDGs_87DUjxm99BvXcuwkaQXQQ`

### 4. Deploy

1. Click **Save and Deploy**
2. Wait for the build to complete (usually 1-2 minutes)
3. You'll get a URL like: `https://elshadai-pos.pages.dev`

### 5. Update CORS (if needed)

If you get CORS errors, update the CORS settings in your Edge Functions:

```typescript
export const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://your-app.pages.dev',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, PUT, DELETE, OPTIONS',
};
```

### 6. Custom Domain (Optional)

To use your own domain:
1. Go to your Cloudflare Pages project
2. Click **Custom domains**
3. Click **Set up a custom domain**
4. Enter your domain
5. Follow the DNS configuration instructions

## Automatic Deployments

Cloudflare Pages automatically deploys when you push to your `main` branch on GitHub. No additional configuration needed!

## Delete Vercel Deployment

Once everything works on Cloudflare Pages:

1. Go to https://vercel.com/dashboard
2. Select your Elshadai frontend project
3. Go to **Settings** → **Advanced**
4. Scroll down and click **Delete Project**
5. Confirm deletion

## Your Complete Supabase Stack

After this migration:
- ✅ **Frontend**: Cloudflare Pages (free, fast CDN)
- ✅ **Backend API**: Supabase Edge Functions
- ✅ **Database**: Supabase PostgreSQL
- ✅ **Authentication**: Custom JWT via Supabase Edge Functions
- ✅ **No Vercel dependency**

## Useful Links

- Cloudflare Pages Docs: https://developers.cloudflare.com/pages/
- Your Cloudflare Dashboard: https://dash.cloudflare.com
- Supabase Dashboard: https://supabase.com/dashboard/project/vphdxmxcwbpkvppytrjn

## Troubleshooting

### Build fails
- Check that the build command includes `cd frontend`
- Verify the output directory is `frontend/dist`

### App loads but API calls fail
- Verify environment variables are set correctly
- Check browser console for CORS errors
- Ensure Supabase anon key is correct

### Login shows "Failed to fetch"
- This means the frontend can't reach the backend
- Double-check `VITE_API_URL` environment variable
- Make sure you've redeployed after adding environment variables
