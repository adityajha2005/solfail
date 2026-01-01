# Publishing Guide

## Pre-Publish Checklist

✅ **Cleanup Complete**
- Removed all test files (`src/test*.ts`)
- Removed temporary documentation files
- Removed test scripts
- Updated `package.json` for publishing

✅ **Build Configuration**
- TypeScript configured with declarations
- Source maps enabled
- Files field configured in `package.json`

## Before Publishing

1. **Update Repository URL**
   ```json
   "repository": {
     "type": "git",
     "url": "https://github.com/YOUR_USERNAME/solfail.git"
   }
   ```

2. **Add Author** (optional)
   ```json
   "author": "Your Name <your.email@example.com>"
   ```

3. **Verify Version**
   - Current version: `1.0.0`
   - Update if needed before publishing

## Publishing to npm

```bash
# 1. Build the project
npm run build

# 2. Verify package contents
npm pack --dry-run

# 3. Login to npm (if not already)
npm login

# 4. Publish
npm publish

# For scoped packages (if using @username/solfail):
npm publish --access public
```

## Publishing to GitHub

```bash
# 1. Initialize git (if not already)
git init

# 2. Add files
git add .

# 3. Commit
git commit -m "Initial commit: Solana transaction failure decoder"

# 4. Add remote
git remote add origin https://github.com/YOUR_USERNAME/solfail.git

# 5. Push
git push -u origin main
```

## Package Contents

The published package includes:
- `dist/` - Compiled JavaScript and TypeScript declarations
- `fixtures/` - Test fixtures including golden fixture
- `README.md` - Main documentation
- `CONTRIBUTING.md` - Contribution guidelines

Excluded (via `.gitignore` and `files` field):
- `node_modules/`
- `src/` - Source files (not needed, only dist is published)
- Test files
- Development documentation

## Post-Publish

1. **Create GitHub Release**
   - Tag the version: `git tag v1.0.0`
   - Push tags: `git push --tags`

2. **Update README**
   - Add installation instructions
   - Add npm badge
   - Update examples with package name

3. **Share**
   - Post on Solana forums
   - Share on Twitter/X
   - Add to Solana developer resources


