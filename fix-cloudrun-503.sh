#!/bin/bash

# Fix Cloud Run 503 Error
# This script updates the Cloud Run service configuration

set -e

echo "🔧 Fixing Cloud Run 503 Error..."

# Set your project ID
PROJECT_ID="promptwar-487605"
SERVICE_NAME="duck-hunt-snarky"
REGION="us-central1"

echo "📋 Project: $PROJECT_ID"
echo "📋 Service: $SERVICE_NAME"
echo "📋 Region: $REGION"

# Configure gcloud
gcloud config set project $PROJECT_ID

echo ""
echo "1️⃣ Checking current service status..."
gcloud run services describe $SERVICE_NAME --region $REGION --format="value(status.url)" || echo "Service not found or error"

echo ""
echo "2️⃣ Updating service configuration..."

# Update the service with correct port and environment variables
gcloud run services update $SERVICE_NAME \
  --region $REGION \
  --port 3000 \
  --memory 512Mi \
  --min-instances 0 \
  --max-instances 10 \
  --timeout 300 \
  --concurrency 80 \
  --cpu 1 \
  --set-env-vars "NODE_ENV=production" \
  --allow-unauthenticated

echo ""
echo "3️⃣ Checking logs for errors..."
gcloud run services logs read $SERVICE_NAME \
  --region $REGION \
  --limit 20

echo ""
echo "✅ Configuration updated!"
echo ""
echo "🌐 Service URL:"
gcloud run services describe $SERVICE_NAME --region $REGION --format="value(status.url)"

echo ""
echo "📝 Next steps:"
echo "1. Wait 30 seconds for the service to restart"
echo "2. Visit the URL above"
echo "3. If still 503, check logs with:"
echo "   gcloud run services logs read $SERVICE_NAME --region $REGION --limit 50"
