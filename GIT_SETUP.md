# Git Repository Setup Guide

## 🔐 Important: This is a Private Project

This repository contains sensitive information and should be kept private.

## 📋 Pre-Commit Checklist

Before committing, ensure:
- [ ] No hardcoded passwords or secrets in code
- [ ] `.env` file is not tracked (check `.gitignore`)
- [ ] `ADMIN_CREDENTIALS.txt` is not tracked
- [ ] No database dumps with real data
- [ ] Environment variables are used for sensitive data
- [ ] README doesn't contain production credentials

## 🚀 Initial Setup

### 1. Initialize Git (Already Done)
```bash
git init
```

### 2. Review Gitignore
Check that sensitive files are ignored:
```bash
cat .gitignore
```

Should include:
- `.env`
- `ADMIN_CREDENTIALS.txt`
- `node_modules/`
- `dist/`
- SSL certificates

### 3. Add Remote (Private Repository)
```bash
# For GitHub
git remote add origin git@github.com:YOUR_USERNAME/YOUR_PRIVATE_REPO.git

# For GitLab
git remote add origin git@gitlab.com:YOUR_USERNAME/YOUR_PRIVATE_REPO.git

# For Bitbucket
git remote add origin git@bitbucket.org:YOUR_USERNAME/YOUR_PRIVATE_REPO.git

# Verify
git remote -v
```

### 4. Initial Commit
```bash
# Add all files
git add .

# Check what will be committed (verify no sensitive files)
git status

# Make initial commit
git commit -m "Initial commit: RADIUS Multi-Tenant Admin Panel"

# Push to remote
git push -u origin main
```

## 🔒 Repository Settings

### GitHub Settings
1. Go to repository Settings
2. Under "Danger Zone" → Make repository **Private**
3. Enable "Require pull request reviews before merging"
4. Enable "Branch protection rules" for `main` branch
5. Disable "Allow force pushes"
6. Enable "Require signed commits" (recommended)

### Access Control
- **Owner**: Full access (you)
- **Collaborators**: Add team members with appropriate roles
  - Admin: Can modify settings
  - Write: Can push to repository
  - Read: Can only clone and view

## 📝 Commit Guidelines

### Commit Message Format
```
<type>: <subject>

<body>

<footer>
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance tasks
- `security`: Security improvements

### Examples
```bash
git commit -m "feat: add NAT configuration UI for dynamic IP users"
git commit -m "fix: resolve admin login authentication issue"
git commit -m "security: update default password handling in init.sql"
git commit -m "docs: add deployment guide for production environment"
```

## 🌿 Branching Strategy

### Main Branches
- `main` - Production-ready code
- `develop` - Development branch
- `staging` - Staging environment (optional)

### Feature Branches
```bash
# Create feature branch
git checkout -b feature/nat-configuration

# Work on feature
git add .
git commit -m "feat: implement NAT rule management"

# Push feature branch
git push origin feature/nat-configuration

# Create Pull Request on GitHub/GitLab
```

### Hotfix Branches
```bash
# Create hotfix from main
git checkout -b hotfix/login-bug main

# Fix and commit
git add .
git commit -m "fix: resolve login authentication issue"

# Merge back to main and develop
git checkout main
git merge hotfix/login-bug
git checkout develop
git merge hotfix/login-bug
```

## 🔍 Security Checks

### Before Every Commit
```bash
# Check for hardcoded secrets
grep -r "password\|secret\|api_key" --include="*.js" --include="*.ts" src/

# Check for exposed credentials
git diff --cached | grep -E "password|secret|321321|admin123"

# Verify .env is not staged
git status | grep ".env"
```

### Automated Security Scanning
Consider adding these to CI/CD:
- `npm audit` - Check npm dependencies
- `git-secrets` - Prevent committing secrets
- `truffleHog` - Search for high entropy strings

## 🚫 What NOT to Commit

Never commit these files:
- `.env` files with real credentials
- `ADMIN_CREDENTIALS.txt`
- Database dumps with real data
- SSL certificates and private keys
- `node_modules/` directories
- IDE-specific files (`.idea`, `.vscode` config)
- Log files
- Backup files

## 🔄 Keeping Repository Clean

### Remove Sensitive Data from History (If Accidentally Committed)
```bash
# WARNING: This rewrites history!
# Use with caution, coordinate with team

# Remove file from all commits
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch path/to/sensitive/file" \
  --prune-empty --tag-name-filter cat -- --all

# Force push (only if coordinated with team!)
git push origin --force --all
```

Better alternative using BFG Repo-Cleaner:
```bash
# Install BFG
brew install bfg  # macOS

# Remove passwords
bfg --replace-text passwords.txt .git

# Cleanup
git reflog expire --expire=now --all
git gc --prune=now --aggressive
```

## 📦 Releases & Tags

### Creating a Release
```bash
# Tag version
git tag -a v1.0.0 -m "Release version 1.0.0"

# Push tag
git push origin v1.0.0

# Or push all tags
git push --tags
```

### Semantic Versioning
- `v1.0.0` - Major release (breaking changes)
- `v1.1.0` - Minor release (new features)
- `v1.1.1` - Patch release (bug fixes)

## 🔐 SSH Key Setup (Recommended)

### Generate SSH Key
```bash
# Generate new key
ssh-keygen -t ed25519 -C "your_email@example.com"

# Start ssh-agent
eval "$(ssh-agent -s)"

# Add key to agent
ssh-add ~/.ssh/id_ed25519

# Copy public key
cat ~/.ssh/id_ed25519.pub
```

### Add to GitHub/GitLab
1. Copy public key content
2. Go to Settings → SSH Keys
3. Add new SSH key
4. Test connection: `ssh -T git@github.com`

## 📊 Useful Git Commands

### Status & History
```bash
# Check status
git status

# View commit history
git log --oneline --graph --all

# View specific file history
git log --follow filename.js
```

### Undoing Changes
```bash
# Discard local changes
git checkout -- filename.js

# Unstage file
git reset HEAD filename.js

# Undo last commit (keep changes)
git reset --soft HEAD~1

# Undo last commit (discard changes)
git reset --hard HEAD~1
```

### Working with Remote
```bash
# Fetch changes
git fetch origin

# Pull changes
git pull origin main

# Push changes
git push origin main

# View remotes
git remote -v
```

## 🛡️ Git Hooks (Optional)

### Pre-commit Hook
Create `.git/hooks/pre-commit`:
```bash
#!/bin/bash

# Check for .env file
if git diff --cached --name-only | grep -q "^\.env$"; then
    echo "Error: Attempting to commit .env file!"
    exit 1
fi

# Check for common passwords
if git diff --cached | grep -iE "password.*=.*(admin123|321321)"; then
    echo "Error: Found hardcoded password in commit!"
    exit 1
fi

exit 0
```

Make executable:
```bash
chmod +x .git/hooks/pre-commit
```

## 📞 Support

For repository access issues:
1. Check if you have correct permissions
2. Verify SSH key is added
3. Contact repository owner

---

**⚠️ SECURITY REMINDER**: This is a private repository. Do not share access credentials or make repository public.

