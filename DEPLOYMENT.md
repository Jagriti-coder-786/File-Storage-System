# 🚀 CloudVault Deployment Guide

Quick, step-by-step guide to deploy **CloudVault** on **Render** (Backend) and **Vercel** (Frontend).

---

## 📋 Quick Setup Flow

```
[MongoDB Atlas & Cloudinary] ➜ [1. Deploy Render Backend] ➜ [2. Deploy Vercel Frontend] ➜ [3. Set CORS]
```

---

## 1. Backend Deployment (Render Web Service)

1. Open [Render Dashboard](https://dashboard.render.com/) → **New +** → **Web Service**.
2. Connect your repository: `Jagriti-coder-786/File-Storage-System`.
3. Configure the service:

| Setting | Value |
| :--- | :--- |
| **Name** | `cloudvault-server` |
| **Region** | Oregon *(or closest region)* |
| **Branch** | `main` |
| **Root Directory** | `server` |
| **Runtime** | `Node` |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm run start` |
| **Instance Type** | `Free` |
| **Health Check Path** | `/health` *(under Advanced)* |

4. In **Environment Variables**, click **"Add from .env"** and paste:

```env
NODE_ENV=production
PORT=10000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/cloudvault?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key_min_32_characters
JWT_EXPIRES_IN=7d
DEFAULT_STORAGE_QUOTA=1073741824
STORAGE_PROVIDER=cloudinary
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
CLIENT_URL=http://localhost:5173
```

5. Click **Create Web Service**.
6. When live, copy your backend URL:
   `https://<your-service>.onrender.com`

---

## 2. Frontend Deployment (Vercel)

1. Open [Vercel Dashboard](https://vercel.com/) → **Add New...** → **Project**.
2. Import `Jagriti-coder-786/File-Storage-System`.
3. Configure project settings:

| Setting | Value |
| :--- | :--- |
| **Framework Preset** | `Vite` |
| **Root Directory** | Click Edit → select `client` |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |

4. Under **Environment Variables**, add:

| Key | Value |
| :--- | :--- |
| `VITE_API_BASE_URL` | `https://<your-service>.onrender.com/api` |

*(Replace with your actual Render backend URL from Step 1)*

5. Click **Deploy**. Copy your production Vercel URL:
   `https://<your-app>.vercel.app`

---

## 3. Connect Frontend & Backend (Final CORS Step)

1. Go to [Render Dashboard](https://dashboard.render.com/) → `cloudvault-server` → **Environment**.
2. Update `CLIENT_URL` to your Vercel URL:
   ```env
   CLIENT_URL=https://<your-app>.vercel.app
   ```
3. Click **Save Changes** (Render will automatically redeploy).

---

## ✅ Verification Checklist

- [ ] `https://<your-backend>.onrender.com/health` returns `{"status":"ok"}`
- [ ] Vercel site loads cleanly at root `/`
- [ ] Register new account & log in
- [ ] Upload an image / document
- [ ] Refresh pages on sub-routes (`/files`, `/settings`) without 404
- [ ] Create & test a public share link in an incognito tab

---

## 💡 Quick Tips

- **Free Tier Sleep**: Render spins down after 15 min of inactivity. Keep it warm by setting up a free 10-minute ping to `/health` on [Cron-Job.org](https://cron-job.org/) or [UptimeRobot](https://uptimerobot.com/).
- **MongoDB Access**: Make sure MongoDB Atlas Network Access has IP `0.0.0.0/0` allowed.
