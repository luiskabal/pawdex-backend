#!/bin/bash
echo "Building application..."
npm run build
echo "Generating Prisma client..."
npx prisma generate
echo "Checking build output..."
ls -la
echo "Checking dist directory..."
ls -la dist/
echo "Starting application..."
node dist/main.js