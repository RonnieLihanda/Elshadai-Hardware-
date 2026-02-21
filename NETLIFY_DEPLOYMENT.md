# Deploy to Netlify

Quick guide to deploy your Elshadai POS frontend to Netlify.

## Why Netlify?
- ✅ Free tier (100GB bandwidth/month)
- ✅ Automatic GitHub deployments
- ✅ Fast global CDN
- ✅ Perfect for SPAs (Single Page Apps)
- ✅ Easy environment variable setup

## Prerequisites
- Netlify account (free): https://app.netlify.com/signup
- GitHub repository (you have it)

## Deploy in 3 Minutes

### Method 1: Via Netlify Dashboard (Recommended)

1. **Sign up / Log in to Netlify**
   - Go to https://app.netlify.com
   - Sign up with GitHub (easiest)

2. **Import from GitHub**
   - Click **Add new site** → **Import an existing project**
   - Click **Deploy with GitHub**
   - Authorize Netlify to access your GitHub
   - Select repository: **Elshadai-Hardware-**

3. **Build Settings** (Auto-detected from netlify.toml!)
   - Netlify will automatically use the settings from `netlify.toml`
   - You should see:
     - Base directory: `frontend`
     - Build command: `npm install && npm run build`
     - Publish directory: `frontend/dist`
   - If not auto-detected, enter these manually

4. **Environment Variables**
   Click **Show advanced** → **New variable** and add:

   **Variable 1:**
   - Key: `VITE_API_URL`
   - Value: `https://vphdxmxcwbpkvppytrjn.supabase.co/functions/v1`

   **Variable 2:**
   - Key: `VITE_SUPABASE_ANON_KEY`
   - Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwaGR4bXhjd2Jwa3ZwcHl0cmpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzNTgxNjUsImV4cCI6MjA4NjkzNDE2NX0.OFDdro1YVAY3hY1JJBDGs_87DUjxm99BvXcuwkaQXQQ`

5. **Deploy!**
   - Click **Deploy site**
   - Wait 2-3 minutes for build to complete
   - You'll get a URL like: `https://random-name-123.netlify.app`

6. **Optional: Custom Domain**
   - Go to **Site settings** → **Domain management**
   - Click **Add custom domain**
   - Enter your domain name
   - Follow DNS configuration instructions

### Method 2: Via Netlify CLI (Alternative)

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy (from project root)
netlify deploy --prod
```

## Your Complete Stack 🎉

- **Frontend**: Netlify (static hosting)
- **Backend**: Supabase Edge Functions
- **Database**: Supabase PostgreSQL
- **No Vercel dependency!**

## Automatic Deployments

Every time you push to the `main` branch on GitHub, Netlify will automatically:
1. Pull the latest code
2. Build your frontend
3. Deploy the new version

No manual work needed! 🚀

## Update Environment Variables Later

1. Go to https://app.netlify.com
2. Select your site
3. Go to **Site settings** → **Environment variables**
4. Edit/add variables
5. Trigger a new deploy: **Deploys** → **Trigger deploy** → **Deploy site**

## Troubleshooting

### Build fails with "command not found"
- Make sure `netlify.toml` is in the root directory
- Check that base directory is set to `frontend`

### Site loads but API calls fail
- Verify environment variables are set correctly
- Check browser console for errors
- Ensure `VITE_SUPABASE_ANON_KEY` is correct

### 404 on page refresh
- The `netlify.toml` redirect rules should fix this
- If not, add a `_redirects` file in `frontend/public/`:
  ```
  /* /index.html 200
  ```

## Delete Vercel

Once everything works on Netlify:
1. Go to https://vercel.com/dashboard
2. Select your frontend project
3. Settings → Advanced → Delete Project

## Useful Links

- Your Netlify Dashboard: https://app.netlify.com
- Netlify Docs: https://docs.netlify.com
- Supabase Dashboard: https://supabase.com/dashboard/project/vphdxmxcwbpkvppytrjn

## Need Help?

- Check build logs in Netlify dashboard
- Review environment variables
- Ensure backend is running on Supabase
- Test API endpoints directly in browser
