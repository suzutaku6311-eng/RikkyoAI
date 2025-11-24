#!/usr/bin/env bash

APP_NAME=${1:-rag-internal-ai}

echo "Creating Next.js 14 app: $APP_NAME ..."

npx create-next-app@latest "$APP_NAME" \
  --typescript \
  --app \
  --tailwind \
  --eslint \
  --src-dir=false \
  --import-alias "@/*"

echo "Done. cd $APP_NAME で移動してください。"

