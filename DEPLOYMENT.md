# detailed Deployment Guide for PharmaGuard

This guide covers 4 ways to deploy PharmaGuard:
1.  **Vercel** (Recommended for Next.js - Zero Config)
2.  **Netlify** (Alternative static/serverless host)
3.  **Docker** (Containerized deployment for any cloud)
4.  **Manual / VPS** (Ubuntu/Debian server)

---

## 1. Deploy to Vercel (Recommended) & Netlify

Since PharmaGuard is a Next.js application, Vercel provides the smoothest deployment experience.

### Prerequisites
- A GitHub, GitLab, or Bitbucket account.
- Push your code to a repository.

### Steps
1.  Go to [Vercel.com](https://vercel.com) and sign up/login.
2.  Click **"Add New..."** -> **"Project"**.
3.  Import your `pharmaguard` repository.
4.  **Configure Project**:
    - **Framework Preset**: Next.js (should be auto-detected).
    - **Root Directory**: `./` (default).
    - **Environment Variables**: Add any keys from your `.env.local`:
        - `NEXT_PUBLIC_API_URL` (if used)
        - `GROQ_API_KEY` (if used)
        - `GOOGLE_API_KEY` (if used)
5.  Click **Deploy**.

Vercel will build your project and provide a live URL (e.g., `https://pharmaguard.vercel.app`).

---

## 2. Docker Deployment

If you prefer containerization or want to host on AWS/GCP/Azure, use Docker.

### 1. Create `Dockerfile`
Create a file named `Dockerfile` in the project root:

```dockerfile
# Base image
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Disable telemetry during build
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

### 2. Update `next.config.mjs`
To use Docker efficiently (standalone mode), update your config:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone", // <--- ADD THIS LINE
  // ... existing headers config ...
};
export default nextConfig;
```

### 3. Build & Run
```bash
# Build the image
docker build -t pharmaguard .

# Run the container
docker run -p 3000:3000 pharmaguard
```

Visit `http://localhost:3000`.

---

## 3. Manual Deployment (VPS / Ubuntu)

To run on a standard Linux server (e.g., EC2, DigitalOcean Droplet).

### Steps
1.  **Install Node.js & PM2**:
    ```bash
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
    sudo npm install -g pm2
    ```

2.  **Clone & Install**:
    ```bash
    git clone https://github.com/your-repo/pharmaguard.git
    cd pharmaguard
    npm install
    ```

3.  **Build**:
    ```bash
    npm run build
    ```

4.  **Start with PM2**:
    ```bash
    pm2 start npm --name "pharmaguard" -- start
    pm2 save
    pm2 startup
    ```

The app will run on port 3000. Use Nginx as a reverse proxy to serve on port 80/443.

---

## critical: public/data Check
Regardless of deployment method, ensure the `public/data/summary_ann_evidence.tsv` file is included in your repository/build context.
- **Git**: Ensure `.gitignore` does **NOT** exclude `public/data`.
- **Docker**: The `COPY --from=builder /app/public ./public` line handles this.
