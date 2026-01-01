# Deployment Guide

## Pre-Deployment Checklist

✅ **Code Ready**
- All test files removed
- Build successful
- Library entry point created
- Documentation complete

## Step 1: Update Repository URL

Edit `package.json` and update the repository URL:

```json
"repository": {
  "type": "git",
  "url": "https://github.com/YOUR_USERNAME/solfail.git"
}
```

## Step 2: Initialize Git Repository

```bash
# Initialize git
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: Solana transaction failure decoder SDK"

# Add remote (replace with your GitHub repo URL)
git remote add origin https://github.com/YOUR_USERNAME/solfail.git

# Push to GitHub
git branch -M main
git push -u origin main
```

## Step 3: Publish to npm

```bash
# 1. Login to npm (if not already)
npm login

# 2. Verify package contents
npm pack --dry-run

# 3. Publish
npm publish

# For scoped packages (if using @username/sol-pro):
# npm publish --access public
```

## Step 4: Create GitHub Release

```bash
# Tag the version
git tag v1.0.0

# Push tags
git push --tags

# Then create a release on GitHub with release notes
```

## Post-Deployment

1. **Update README** with npm installation instructions
2. **Add npm badge** to README
3. **Share** on Solana developer communities

## Verification

After publishing, test installation:

```bash
# Test npm install
npm install sol-pro

# Test import
node -e "const { decodeTransactionFailure } = require('solfail'); console.log('✅ Import works');"

# Test CLI (if installed globally)
solfail --help
```

