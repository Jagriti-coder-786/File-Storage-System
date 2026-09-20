# 🚀 CloudVault Deployment Guide: Render (Backend) + Vercel (Frontend)

This guide provides step-by-step instructions to deploy **CloudVault** with **Render** hosting the Express/Node backend and **Vercel** hosting the React/Vite frontend.

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────┐       ┌─────────────────────────────────┐
│        Vercel (Frontend)        │       │         Render (Backend)        │
│  React + Vite + Tailwind CSS    │──────>│     Express + TypeScript API    │
│  https://cloudvault.vercel.app  │  API  │ https://cloudvault.onrender.com │
└─────────────────────────────────┘       └──────────────┬──────────────────┘
                                                         │
                                        ┌────────────────┴────────────────┐
                                        │                                 │
                                        ▼                                 ▼
                         ┌─────────────────────────────┐   ┌─────────────────────────────┐
                         │   MongoDB Atlas (Database)  │   │ Cloudinary / S3 (Storage)   │
                         │   mongodb+srv://...         │   │ Images, Videos, PDFs, Docs  │
                         └─────────────────────────────┘   └─────────────────────────────┘
```

---

## 📋 Prerequisites

1. **GitHub Account**: Push this repository to your GitHub.
2. **MongoDB Atlas Account** (Free): [mongodb.com/atlas](https://www.mongodb.com/atlas)
3. **Cloudinary Account** (Free): [cloudinary.com](https://cloudinary.com) *(Recommended for cloud storage)*
4. **Render Account** (Free): [render.com](https://render.com)
5. **Vercel Account** (Free): [vercel.com](https://vercel.com)

---

## Step 1: Set Up MongoDB Atlas Database

1. Log in to [MongoDB Atlas](https://cloud.mongodb.com/).
2. Create a free **M0 Cluster** (choose AWS or GCP in your closest region).
3. Under **Database Access**, create a user (e.g., `admin`) and set a strong password.
4. Under **Network Access**, click **Add IP Address** -> select **Allow Access from Anywhere (`0.0.0.0/0`)** (required for Render to connect).
5. Go to **Clusters** -> click **Connect** -> choose **Drivers** (Node.js).
6. Copy your connection string:
   ```
   mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/cloudvault?retryWrites=true&w=majority
   ```

---

## Step 2: Deploy Backend to Render

### Option A: Using Render Blueprint (Automatic via `render.yaml`)

1. Log in to [Render](https://dashboard.render.com/).
2. Click **New +** -> **Blueprint**.
3. Connect your GitHub repository.
4. Render will detect `render.yaml` and set up the `cloudvault-server` service automatically.
5. Fill in the prompted environment variables (`MONGODB_URI`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`).
6. Click **Apply**.

---

### Option B: Manual Web Service Setup on Render

1. Log in to [Render](https://dashboard.render.com/).
2. Click **New +** -> **Web Service**.
3. Connect your GitHub repository.
4. Configure the settings:
   - **Name**: `cloudvault-server`
   - **Region**: Closest to you (e.g., Oregon or Frankfurt)
   - **Branch**: `main`
   - **Root Directory**: `server`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start`
   - **Instance Type**: `Free`
5. Click **Advanced** -> **Add Environment Variables**:

| Variable Key | Recommended Value / Notes |
|---|---|
| `NODE_ENV` | `production` |
| `PORT` | `10000` |
| `MONGODB_URI` | Your MongoDB Atlas connection string |
| `JWT_SECRET` | A secure random 64-character secret key |
| `JWT_EXPIRES_IN` | `7d` |
| `DEFAULT_STORAGE_QUOTA` | `1073741824` *(1 GB in bytes)* |
| `CLIENT_URL` | `https://your-cloudvault-app.vercel.app` *(update after Step 3)* |
| `STORAGE_PROVIDER` | `cloudinary` |
| `CLOUDINARY_CLOUD_NAME` | Your Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Your Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Your Cloudinary API secret |

6. Click **Create Web Service**.
7. Once deployed, copy your backend URL:
   `https://cloudvault-server.onrender.com`
8. Verify by opening `https://cloudvault-server.onrender.com/health` in your browser. You should see `{"status":"ok"}`.

---

## Step 3: Deploy Frontend to Vercel

1. Log in to [Vercel](https://vercel.com/).
2. Click **Add New...** -> **Project**.
3. Import your GitHub repository.
4. Configure Project:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click *Edit* and select **`client`** (or keep root if utilizing root workspace)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Under **Environment Variables**, add:

| Key | Value |
|---|---|
| `VITE_API_BASE_URL` | `https://cloudvault-server.onrender.com/api` |

*(Replace with your actual Render backend URL from Step 2)*

6. Click **Deploy**.
7. Once deployed, Vercel will give you a domain like `https://cloudvault-xxx.vercel.app`.

---

## Step 4: Final Linkage & CORS Update

1. Go back to your [Render Dashboard](https://dashboard.render.com/) -> `cloudvault-server` -> **Environment**.
2. Update `CLIENT_URL` to your Vercel production domain:
   ```
   CLIENT_URL=https://cloudvault-xxx.vercel.app
   ```
3. Save changes. Render will automatically redeploy with the updated CORS rule.

---

## 🧪 Verification Checklist

- [ ] Backend health check responds: `https://<render-url>/health`
- [ ] Frontend loads smoothly: `https://<vercel-url>/`
- [ ] User registration and login works
- [ ] File upload and folder creation works
- [ ] File preview (PDF, Images, Code, Audio, Video) works
- [ ] Share links work across public browsers: `https://<vercel-url>/share/<token>`
- [ ] Page refresh on sub-routes (`/files`, `/recent`, `/settings`, `/admin`) does not return 404
