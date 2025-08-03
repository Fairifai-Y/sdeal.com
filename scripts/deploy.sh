#!/bin/bash

echo "🚀 Starting SDeal.com deployment..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "📦 Installing frontend dependencies..."
npm install

echo "🔧 Setting up images..."
npm run setup-images

echo "🏗️ Building React application..."
npm run build

echo "📦 Installing backend dependencies..."
cd server
npm install

echo "✅ Build complete!"
echo ""
echo "🎯 To start the application:"
echo "   Frontend (development): npm start"
echo "   Backend (development):  cd server && npm run dev"
echo "   Production:            cd server && npm start"
echo ""
echo "🌐 The application will be available at:"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:3001"
echo "   API Health: http://localhost:3001/api/health" 