# Deploy to Google Cloud Run

## Prerequisites
1.  **Google Cloud Project**: Have a project created in the Console.
2.  **gcloud CLI**: Installed and authenticated locally (`gcloud auth login`).

## Steps

1.  **Containerize the Application**
    Create a `Dockerfile` in the root (already supported by Next.js, but needs specific configuration for simple deployment):

    ```dockerfile
    FROM node:18-alpine AS base

    FROM base AS deps
    RUN apk add --no-cache libc6-compat
    WORKDIR /app
    COPY package.json package-lock.json ./
    RUN npm ci

    FROM base AS builder
    WORKDIR /app
    COPY --from=deps /app/node_modules ./node_modules
    COPY . .
    # Disable telemetry during build
    ENV NEXT_TELEMETRY_DISABLED 1
    RUN npm run build

    FROM base AS runner
    WORKDIR /app
    ENV NODE_ENV production
    ENV NEXT_TELEMETRY_DISABLED 1
    
    RUN addgroup --system --gid 1001 nodejs
    RUN adduser --system --uid 1001 nextjs

    COPY --from=builder /app/public ./public
    COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
    COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

    USER nextjs
    EXPOSE 3000
    ENV PORT 3000
    CMD ["node", "server.js"]
    ```

2.  **Update `next.config.ts`**
    Ensure `output: 'standalone'` is set in `next.config.ts`.
    
    ```ts
    const nextConfig = {
      output: "standalone",
    };
    export default nextConfig;
    ```

3.  **Build & Push to Artifact Registry**
    ```bash
    gcloud artifacts repositories create duck-hunt-repo --repository-format=docker --location=us-central1
    gcloud builds submit --tag us-central1-docker.pkg.dev/[PROJECT_ID]/duck-hunt-repo/duck-hunt-snarky .
    ```

4.  **Deploy to Cloud Run**
    ```bash
    gcloud run deploy duck-hunt-snarky \
      --image us-central1-docker.pkg.dev/[PROJECT_ID]/duck-hunt-repo/duck-hunt-snarky \
      --platform managed \
      --region us-central1 \
      --allow-unauthenticated \
      --set-env-vars GEMINI_API_KEY=[YOUR_GEMINI_API_KEY]
    ```

5.  **Access**
    Google Cloud Run will provide a URL (e.g., `https://duck-hunt-snarky-xyz-uc.a.run.app`).

## Performance Tuning
- Set CPU to at least 1 vCPU and 512MB RAM for SSR performance.
- Use `min-instances: 1` to avoid cold starts if consistent traffic is expected.
