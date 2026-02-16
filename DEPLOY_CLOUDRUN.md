# Deploy Duck Hunt 2026 to Google Cloud Run

## Prerequisites
- Google Cloud Shell (already set up ✅)
- Project ID: `promptwar-487605` ✅
- Code already pulled ✅

## Deployment Commands

Run these commands in **Google Cloud Shell** in order:

### 1. Navigate to your project directory
```bash
cd duck-hunt-snarky
```

### 2. Set your project ID
```bash
gcloud config set project promptwar-487605
```

### 3. Enable required APIs
```bash
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable artifactregistry.googleapis.com
```

### 4. Build and deploy in one command
```bash
gcloud run deploy duck-hunt-snarky \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1 \
  --port 8080 \
  --max-instances 10 \
  --min-instances 0
```

**Note:** The `--source .` flag automatically builds the Docker image and deploys it!

### 5. Get your live URL
After deployment completes, you'll see output like:
```
Service [duck-hunt-snarky] revision [duck-hunt-snarky-00001-xxx] has been deployed and is serving 100 percent of traffic.
Service URL: https://duck-hunt-snarky-xxxxx-uc.a.run.app
```

## Alternative: Manual Docker Build (if needed)

If you prefer to build the Docker image manually:

```bash
# Set variables
export PROJECT_ID=promptwar-487605
export SERVICE_NAME=duck-hunt-snarky
export REGION=us-central1

# Build with Cloud Build
gcloud builds submit --tag gcr.io/$PROJECT_ID/$SERVICE_NAME

# Deploy
gcloud run deploy $SERVICE_NAME \
  --image gcr.io/$PROJECT_ID/$SERVICE_NAME \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1 \
  --port 8080
```

## Quick Deploy (Copy-Paste Ready)

Just copy and paste this entire block into Cloud Shell:

```bash
cd duck-hunt-snarky && \
gcloud config set project promptwar-487605 && \
gcloud services enable cloudbuild.googleapis.com run.googleapis.com artifactregistry.googleapis.com && \
gcloud run deploy duck-hunt-snarky \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1 \
  --port 8080 \
  --max-instances 10 \
  --min-instances 0
```

## Troubleshooting

### If you get "Permission denied" errors:
```bash
gcloud auth login
gcloud config set project promptwar-487605
```

### To view logs:
```bash
gcloud run services logs read duck-hunt-snarky --region us-central1 --limit 50
```

### To update the deployment:
Just run the deploy command again - Cloud Run will create a new revision.

### To delete the service:
```bash
gcloud run services delete duck-hunt-snarky --region us-central1
```

## Expected Build Time
- First deployment: ~5-8 minutes
- Subsequent deployments: ~3-5 minutes

## Camera Permissions Note
Since the game uses webcam for hand tracking, users will need to:
1. Grant camera permissions when prompted
2. Use HTTPS (Cloud Run provides this automatically)

## Cost Estimate
- Cloud Run free tier: 2 million requests/month
- This game should stay within free tier for moderate usage
- Estimated cost for 10,000 users/month: ~$0-5

🎮 **Happy Duck Hunting!**
