#!/bin/bash

# =====================================================
# Git Repository Initial Setup Script
# =====================================================
# This script will help you set up the git repository
# Run this after reviewing all files for sensitive data
# =====================================================

echo "🚀 RADIUS Admin Panel - Git Setup"
echo "=================================="
echo ""

# Check if we're in the right directory
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Check for sensitive files
echo "🔍 Checking for sensitive files..."
if [ -f ".env" ]; then
    echo "⚠️  Warning: .env file found! Make sure it's in .gitignore"
fi

if [ -f "ADMIN_CREDENTIALS.txt" ]; then
    echo "⚠️  Warning: ADMIN_CREDENTIALS.txt found! Make sure it's in .gitignore"
fi

# Verify .gitignore
echo ""
echo "📋 Verifying .gitignore..."
if grep -q ".env" .gitignore && grep -q "ADMIN_CREDENTIALS.txt" .gitignore; then
    echo "✅ .gitignore is configured correctly"
else
    echo "❌ Error: .gitignore is missing critical entries!"
    echo "Please review .gitignore file"
    exit 1
fi

echo ""
echo "📦 Ready to commit the following files:"
git add -n . | head -20
echo "... and more"

echo ""
echo "⚠️  IMPORTANT SECURITY CHECKS:"
echo "   1. Have you reviewed all files for sensitive data?"
echo "   2. Have you confirmed .env is NOT being committed?"
echo "   3. Have you updated env.example with safe defaults?"
echo "   4. Have you removed any production credentials?"
echo ""

read -p "Have you completed all security checks? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "❌ Aborting. Please complete security checks first."
    exit 1
fi

echo ""
echo "🎯 Initializing Git repository..."

# Add all files
echo "Adding files..."
git add .

# Show status
echo ""
echo "📊 Git Status:"
git status

echo ""
read -p "Proceed with initial commit? (yes/no): " commit_confirm

if [ "$commit_confirm" != "yes" ]; then
    echo "❌ Aborting commit."
    exit 1
fi

# Make initial commit
echo ""
echo "💾 Creating initial commit..."
git commit -m "Initial commit: RADIUS Multi-Tenant Admin Panel

- Multi-tenant architecture with RBAC
- RADIUS integration (radcheck, radreply, radacct)
- IP management with NAT support
- Mikrotik device integration
- User and session management
- Complete documentation
- Docker containerization
- Security-hardened configuration"

echo ""
echo "✅ Initial commit created successfully!"
echo ""
echo "📝 Next steps:"
echo "   1. Create a private repository on GitHub/GitLab/Bitbucket"
echo "   2. Add remote:"
echo "      git remote add origin <your-repo-url>"
echo "   3. Push to remote:"
echo "      git push -u origin main"
echo ""
echo "🔐 Security Reminders:"
echo "   - Keep repository PRIVATE"
echo "   - Change all default passwords before production"
echo "   - Review SECURITY_CHECKLIST.md"
echo "   - Set up branch protection rules"
echo ""
echo "📚 Documentation:"
echo "   - README.md - Project overview"
echo "   - DEPLOYMENT.md - Deployment guide"
echo "   - GIT_SETUP.md - Git workflow"
echo "   - SECURITY_CHECKLIST.md - Security guidelines"
echo ""

