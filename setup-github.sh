#!/bin/bash

# GitHub Setup Script for CodeCircle
# Replace YOUR_USERNAME and REPO_NAME with your actual GitHub details

echo "🚀 Setting up GitHub repository for CodeCircle..."
echo ""
echo "INSTRUCTIONS:"
echo "1. First, create a new repository on GitHub.com"
echo "2. Use the repository name: codecircle (or your preferred name)"
echo "3. DO NOT initialize with README, .gitignore, or license"
echo "4. Copy the repository URL from GitHub"
echo "5. Run the commands below with your actual repository URL"
echo ""

echo "📝 Commands to run (replace YOUR_USERNAME and REPO_NAME):"
echo ""
echo "git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git"
echo "git branch -M main"
echo "git push -u origin main"
echo ""

echo "🔍 Current git status:"
git status
echo ""

echo "📊 Current commits:"
git log --oneline -5
echo ""

echo "✅ Your project is ready to push to GitHub!"
echo "After running the commands above, your repository will be live on GitHub."
