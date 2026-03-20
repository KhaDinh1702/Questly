# Questly — Deployment Guide

## Architecture

| Layer     | Technology              | Platform               |
|-----------|-------------------------|------------------------|
| Frontend  | React + Vite            | Cloudflare Pages       |
| Backend   | Node.js + Hono          | Cloudflare Workers     |
| Database  | MongoDB                 | MongoDB Atlas (Free)   |

---

## Setup Steps

### 1. MongoDB Atlas
1. Tạo tài khoản tại [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Tạo **Free Shared Cluster** (M0)
3. Tạo user và lấy Connection String: `mongodb+srv://...`
4. Mở **Network Access** → Add IP `0.0.0.0/0` (for Cloudflare Workers)

---

### 2. Backend (Cloudflare Workers)

```bash
cd backend
npm install
```

**Chạy local:**
```bash
npm run dev
# → http://localhost:8787
```

**Thêm secret cho Cloudflare Workers:**
```bash
# Secret này KHÔNG lưu trong code
npx wrangler secret put MONGODB_URI
npx wrangler secret put FRONTEND_URL
```

Hoặc thêm trong **Cloudflare Dashboard → Workers & Pages → your-worker → Settings → Variables**.

**Deploy thủ công:**
```bash
npm run deploy
```

---

### 3. Frontend (Cloudflare Pages)

```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

**Deploy lên Cloudflare Pages (lần đầu):**
1. Vào [dash.cloudflare.com](https://dash.cloudflare.com) → **Workers & Pages** → **Create** → **Pages**
2. Connect to Git → chọn GitHub repo này
3. Cấu hình build:
   - **Framework preset**: Vite
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Root directory**: `frontend`
4. Thêm **Environment Variables**:
   - `VITE_API_URL` = URL của Cloudflare Worker (ví dụ: `https://my-app-backend.xxx.workers.dev`)

Từ đó, mỗi lần **push lên `main`**, Cloudflare Pages sẽ tự động **rebuild và deploy** frontend.

---

### 4. Backend Auto-Deploy via GitHub Actions

Thêm các **Secrets** vào GitHub repo:
- `CLOUDFLARE_API_TOKEN` → Lấy từ [dash.cloudflare.com/profile/api-tokens](https://dash.cloudflare.com/profile/api-tokens) (dùng template "Edit Cloudflare Workers")
- `CLOUDFLARE_ACCOUNT_ID` → Tìm trong Cloudflare Dashboard sidebar

Sau đó, mỗi lần **push vào `main`** (khi có thay đổi trong thư mục `backend/`), GitHub Actions sẽ tự động deploy backend lên Cloudflare Workers.

---

## Summary

| Event                             | Result                              |
|-----------------------------------|-------------------------------------|
| Push to `main` (frontend changes) | Cloudflare Pages auto-rebuilds ✅   |
| Push to `main` (backend changes)  | GitHub Actions deploys Worker ✅    |
Thằng Kiệt NGU

