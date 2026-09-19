# CloudVault — Free Services & Zero-Cost Architecture Guide

This document catalogs all services, libraries, and hosting options used in CloudVault to guarantee a **100% free-tier and zero-cost local developer experience**.

---

## 1. Storage Providers

### Provider A: Local Disk Storage Provider (Default)
- **Cost**: $0.00 (Completely Free & Local)
- **Details**: Uses the local file system on the server disk (`uploads/` directory) via Node.js streaming.
- **Benefits**:
  - Requires zero cloud accounts, credit cards, or API tokens.
  - Zero latency for development and local testing.
  - Generates secure, tokenized download URLs directly handled by the backend.
- **Config**:
  ```env
  STORAGE_PROVIDER=local
  LOCAL_STORAGE_DIR=./uploads
  ```

### Provider B: Cloudinary (Free Tier Supported)
- **Free Tier**: 25 Monthly Credits (~25 GB storage / 25 GB bandwidth / 25,000 transformations).
- **Config**:
  ```env
  STORAGE_PROVIDER=cloudinary
  CLOUDINARY_CLOUD_NAME=your_cloud_name
  CLOUDINARY_API_KEY=471494995399617
  CLOUDINARY_API_SECRET=your_api_secret
  # Or full URL: CLOUDINARY_URL=cloudinary://471494995399617:secret@cloud_name
  ```

### Provider C: S3-Compatible Storage (Production Ready)
CloudVault uses the modular `IStorageProvider` interface. You can switch to any of the following free-tier or open-source object storage solutions by setting `STORAGE_PROVIDER=s3`:

1. **Cloudflare R2**:
   - **Free Tier**: 10 GB/month stored, 10 million Class B (read) operations/month, zero egress fees.
   - **S3 Compatibility**: 100% S3 API compatible.
2. **Backblaze B2**:
   - **Free Tier**: 10 GB free cloud storage, 1 GB daily free egress.
   - **S3 Compatibility**: Fully supported S3-compatible endpoints.
3. **MinIO (Self-Hosted)**:
   - **Cost**: $0.00 (Open Source, GNU AGPLv3).
   - **Details**: Can run locally via Docker or native binary for local S3 simulation.
4. **AWS S3 Free Tier**:
   - **Free Tier**: 5 GB standard storage, 20,000 GET requests, 2,000 PUT requests for 12 months.

---

## 2. Database

### MongoDB
- **Local Development**: $0.00 (MongoDB Community Edition running locally on `localhost:27017`).
- **Cloud Deployment**: **MongoDB Atlas M0 Free Tier** provides 512 MB forever-free cloud database with automatic backups and global clusters.
- **Config**:
  ```env
  MONGODB_URI=mongodb://127.0.0.1:27017/cloudvault
  ```

---

## 3. Authentication & Security

- **JSON Web Tokens (JWT)**: Self-contained, cryptographic tokens generated using open-source `jsonwebtoken`. Zero external authentication provider dependencies (no Auth0 / Clerk tier limits).
- **Password Hashing**: `bcryptjs` — battle-tested open-source salted password hashing.
- **Rate Limiting**: `express-rate-limit` — in-memory or Redis-backed rate limiting to protect endpoints against brute force.
- **Security Headers**: `helmet` — sets secure HTTP headers (XSS, Clickjacking, MIME sniffing prevention).

---

## 4. Frontend & Visuals

- **Typography**: Google Fonts Inter (Open Source).
- **Icons**: `lucide-react` (Open Source Feather-derivative icons).
- **Motion**: `framer-motion` (Open Source UI animation library).
- **Charts**: `recharts` (Open Source D3-powered React visualization library).
- **Deployment**: Free on Vercel, Netlify, Render, or Railway.
