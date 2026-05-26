# 🚀 Deploy Gym Tracker to the Internet

Two-part deployment: **Vercel** (frontend, free) + **Render** (backend with persistent disk, free).
Total time: ~10 minutes. Result: 24/7 access from any device.

---

## 1. Push to GitHub

```bash
cd "/Users/roshanshrestha/gym scedule "
git init
git add .
git commit -m "Initial commit"
# Create empty repo at https://github.com/new (name it gym-tracker)
git remote add origin https://github.com/YOUR_USERNAME/gym-tracker.git
git branch -M main
git push -u origin main
```

---

## 2. Deploy Backend (Render)

1. Sign up at **https://render.com** with your GitHub account
2. Click **New +** → **Blueprint**
3. Connect your `gym-tracker` repo
4. Render auto-detects `render.yaml` → click **Apply**
5. Wait ~3 min for build. Your API URL will look like:
   ```
   https://gym-tracker-api.onrender.com
   ```
6. Test it: open `https://gym-tracker-api.onrender.com/api/health`
   → should return `{"ok":true,"users":0}`

✅ Data is stored on a 1 GB persistent disk that survives restarts and deploys.

---

## 3. Deploy Frontend (Vercel)

1. Sign up at **https://vercel.com** with GitHub
2. Click **Add New… → Project** → import `gym-tracker`
3. Expand **Environment Variables** and add:
   | Name | Value |
   |---|---|
   | `VITE_API_BASE` | `https://gym-tracker-api.onrender.com/api` |
4. Click **Deploy** → wait ~1 min → get URL like:
   ```
   https://gym-tracker-xxxx.vercel.app
   ```

---

## 4. Lock down CORS

Back in Render → your `gym-tracker-api` service → **Environment** tab → add:
```
ALLOWED_ORIGINS = https://gym-tracker-xxxx.vercel.app
```
Save (it auto-restarts). Now only your frontend can hit the API.

---

## 5. Keep the API awake (free tier sleeps after 15 min)

Free Render services sleep when idle. First wake-up takes ~30 sec. To stay always-warm:

1. Sign up at **https://uptimerobot.com** (free)
2. **Add New Monitor** → HTTP(s)
3. URL: `https://gym-tracker-api.onrender.com/api/health`
4. Interval: **5 minutes**
5. Save ✅

---

## 6. Install on your phone like a native app

Open your Vercel URL on your phone:

- **iPhone (Safari):** tap Share → **Add to Home Screen**
- **Android (Chrome):** tap menu → **Install app** / **Add to Home Screen**

You'll get an icon, fullscreen app, and offline support (cached UI shell).

---

## 🔄 Updating

```bash
git add .
git commit -m "Update"
git push
```

Both Vercel and Render auto-deploy from `main`. Done.

---

## 🐳 Alternative: Deploy backend with Docker

If you prefer Fly.io, Railway, or your own VPS:

```bash
cd server
docker build -t gym-api .
docker run -d -p 4000:4000 \
  -e JWT_SECRET="$(openssl rand -hex 32)" \
  -e ALLOWED_ORIGINS="https://your-frontend.com" \
  -v gym-data:/app/data \
  --name gym-api gym-api
```

---

## 🔐 Security checklist (already done)

- ✅ Passwords hashed with bcrypt
- ✅ JWT tokens (30-day expiry)
- ✅ Helmet security headers
- ✅ Rate limiting on auth (20 attempts / 15 min per IP)
- ✅ CORS restricted to your frontend
- ✅ Auto-generated `JWT_SECRET` on Render (via `generateValue: true`)
- ✅ Admin-only endpoints protected server-side
