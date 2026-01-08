#!/bin/bash
set -e

echo "🧹 Cleaning build artifacts..."
rm -rf node_modules
rm -rf .next
echo "✅ Cleaned node_modules and .next"

echo "📦 Installing dependencies..."
npm ci --legacy-peer-deps
echo "✅ Dependencies installed"

echo "🔧 Generating Prisma Client..."
npx prisma generate
echo "✅ Prisma Client generated"

echo "🏗️ Building Next.js application..."
npm run build
echo "✅ Build complete"
