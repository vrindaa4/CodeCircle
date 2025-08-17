#!/bin/bash

# CodeCircle - Project Verification Script
# Verifies that the project is ready for GitHub and deployment

echo "🔍 CodeCircle Project Verification"
echo "=================================="
echo ""

# Check Node.js
echo "📦 Checking Node.js..."
if command -v node &> /dev/null; then
    echo "✅ Node.js version: $(node --version)"
else
    echo "❌ Node.js not found"
fi

# Check npm
if command -v npm &> /dev/null; then
    echo "✅ npm version: $(npm --version)"
else
    echo "❌ npm not found"
fi

echo ""

# Check project structure
echo "📁 Checking project structure..."
required_files=(
    "package.json"
    "server/index.js"
    "client/package.json"
    "client/src/App.js"
    ".gitignore"
    "README.md"
    "env.example"
)

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file (missing)"
    fi
done

echo ""

# Check git status
echo "🔧 Git repository status..."
if [ -d ".git" ]; then
    echo "✅ Git repository initialized"
    echo "📝 Commits: $(git rev-list --count HEAD)"
    echo "🌿 Current branch: $(git branch --show-current)"
    
    # Check for uncommitted changes
    if git diff-index --quiet HEAD --; then
        echo "✅ No uncommitted changes"
    else
        echo "⚠️  Uncommitted changes found"
    fi
else
    echo "❌ Git repository not initialized"
fi

echo ""

# Check dependencies
echo "📦 Checking dependencies..."
if [ -d "node_modules" ]; then
    echo "✅ Root dependencies installed"
else
    echo "⚠️  Root dependencies not installed (run: npm install)"
fi

if [ -d "client/node_modules" ]; then
    echo "✅ Client dependencies installed"
else
    echo "⚠️  Client dependencies not installed (run: cd client && npm install)"
fi

echo ""

# Check environment setup
echo "🔧 Environment configuration..."
if [ -f ".env" ]; then
    echo "✅ .env file exists"
else
    echo "⚠️  .env file not found (copy from env.example)"
fi

echo ""

echo "🚀 Ready for GitHub!"
echo "==================="
echo "1. Create repository on GitHub.com"
echo "2. Run: git remote add origin <your-repo-url>"
echo "3. Run: git push -u origin main"
echo ""
echo "🌐 After GitHub setup:"
echo "• Update README with your repository URL"
echo "• Set up environment variables for deployment"
echo "• Consider setting up CI/CD workflows"
echo ""
echo "📚 Documentation:"
echo "• README.md - Project overview and setup"
echo "• DEPLOYMENT.md - Detailed deployment guide"
echo "• env.example - Environment variables template"
