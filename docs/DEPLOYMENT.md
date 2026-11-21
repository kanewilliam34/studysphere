# 🚀 StudySphere Cloud Deployment Guide

This guide covers the quickest, free/low-cost methods to deploy the full StudySphere stack to the cloud.

---

## 🌟 Method 1: Render One-Click Blueprint (Recommended for Hackathons)

Render provides free tiers for PostgreSQL, Web Services, and background tasks. The repository includes an Infrastructure-as-Code `render.yaml` specification that provisions everything automatically.

### Steps:
1. Go to **[dashboard.render.com](https://dashboard.render.com/)** and log in (or sign up with GitHub).
2. Click **New +** > **Blueprint**.
3. Connect your GitHub repository: `kanewilliam34/studysphere`.
4. Render will detect `render.yaml` and display the blueprint plan:
   - **studysphere-db** (Managed PostgreSQL)
   - **studysphere-backend** (FastAPI Python service)
   - **studysphere-web** (Next.js 15 Node.js service)
5. Click **Apply**.
6. Render builds both services, runs the database migrations (`alembic upgrade head`), and outputs your live public HTTPS URLs!

---

## ⚡ Method 2: Vercel (Frontend) + Render (Backend & DB)

For the fastest edge frontend performance with Next.js 15:

### Step 2A: Deploy Backend & Database on Render
1. Create a **PostgreSQL** database on [render.com](https://render.com) (free tier). Copy the **Internal Database URL**.
2. Click **New +** > **Web Service**, connect `kanewilliam34/studysphere`.
   - **Root Directory**: `backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Environment Variables**:
     - `DATABASE_URL`: *(Paste your Render database URL)*
     - `SECRET_KEY`: *(Generate any random 32-character string)*
     - `NEXCONN_APP_KEY`: `your_app_key`
     - `NEXCONN_APP_SECRET`: `your_app_secret`
3. Click **Deploy**. Note the public backend URL (e.g. `https://studysphere-backend.onrender.com`).

### Step 2B: Deploy Web Frontend on Vercel
1. Go to **[vercel.com/new](https://vercel.com/new)** and import `kanewilliam34/studysphere`.
2. In Project Settings:
   - **Root Directory**: Click *Edit* and select **`apps/web`**.
   - **Framework Preset**: Next.js (automatically detected).
3. Under **Environment Variables**:
   - `NEXT_PUBLIC_API_URL`: `https://studysphere-backend.onrender.com/api/v1`
4. Click **Deploy**. Vercel will build and assign you a global HTTPS domain (e.g., `https://studysphere-web.vercel.app`).

---

## 🐳 Method 3: Cloud VPS (AWS EC2 / DigitalOcean / Linode / Hetzner)

Using the built-in Docker Compose and Caddy reverse proxy:

```bash
# 1. SSH into your cloud server
ssh ubuntu@your-server-ip

# 2. Clone the repository
git clone https://github.com/kanewilliam34/studysphere.git
cd studysphere/infrastructure

# 3. Configure environment variables (optional: set your custom domain in Caddyfile)
export SECRET_KEY=$(openssl rand -hex 32)

# 4. Launch entire stack with Caddy HTTPS
docker compose up -d
```
Caddy will automatically provision Let's Encrypt TLS certificates on ports 80/443.

---

## ⚙️ Environment Variables Summary

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql+psycopg://user:pass@host:5432/dbname` |
| `SECRET_KEY` | JWT signing secret | 32+ character random string |
| `NEXCONN_APP_KEY` | Nexconn Chat App Key | Server-side integration key |
| `NEXCONN_APP_SECRET` | Nexconn Chat App Secret | Server-side signature secret |
| `OLLAMA_URL` | Local LLM or remote Ollama endpoint | `http://localhost:11434/api/chat` |
| `NEXT_PUBLIC_API_URL` | Public backend URL for Web Client | `https://api.yourdomain.com/api/v1` |
