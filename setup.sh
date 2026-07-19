#!/bin/bash

# Ultimate Auto Completer - Setup Guide

echo "🚀 Setting up Ultimate Auto Completer v2.0..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from .env.example..."
    cp .env.example .env
    echo "⚠️  Please edit .env with your credentials!"
else
    echo "✅ .env already exists"
fi

# Create necessary directories
echo "📁 Creating data directories..."
mkdir -p logs data/sessions

# Test configuration
echo "🔍 Validating configuration..."
node -e "import('./src/utils/config.js').then(() => console.log('✅ Configuration valid')).catch(e => console.error('❌ Configuration error:', e.message))"

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env with your credentials"
echo "2. Start the bot: npm start"
echo "3. Or use dev mode: npm run dev"
