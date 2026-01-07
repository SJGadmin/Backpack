#!/bin/bash

# Database Migration Script for Vercel Postgres
# This script pushes the Prisma schema and imports CSV data

set -e  # Exit on error

echo "🗄️  Database Migration Script"
echo "================================"
echo ""

# Step 1: Push Prisma schema to database
echo "📤 Step 1: Pushing Prisma schema to Vercel Postgres..."
npx prisma db push

echo ""
echo "✅ Schema pushed successfully!"
echo ""

# Step 2: Run data import script
echo "📥 Step 2: Importing CSV data..."
node scripts/migrate-and-import.js

echo ""
echo "🎉 All done! Your database is ready to use."
