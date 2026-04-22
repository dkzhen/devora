#!/bin/bash

# Devora Production Deploy Script
# Run this after git pull

echo "🚀 Starting Devora deployment..."

# 1. Install dependencies
echo "📦 Installing dependencies..."
npm install

# 2. Generate Prisma Client
echo "🔧 Generating Prisma Client..."
npx prisma generate

# 3. Run database migrations
echo "🗄️  Running database migrations..."
npx prisma migrate deploy

# 4. Build Next.js
echo "🏗️  Building Next.js..."
npm run build

# 5. Restart PM2 with updated env
echo "♻️  Restarting PM2 with updated environment..."
pm2 restart devora --update-env

# 6. Save PM2 state
echo "💾 Saving PM2 state..."
pm2 save

echo "✅ Deployment complete!"
echo "� Check status: pm2 status"
echo "📝 Check logs: pm2 logs devora"
