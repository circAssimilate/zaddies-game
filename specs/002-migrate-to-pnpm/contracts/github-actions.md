# GitHub Actions Workflow Contracts

**Feature**: 002-migrate-to-pnpm
**Date**: 2025-10-26
**Status**: Complete

## Overview

This document defines the contract for GitHub Actions workflows using pnpm instead of npm. It includes CI workflow for quality checks and deployment workflow for Firebase deployment with pnpm workspace isolation.

## CI Workflow Contract

**File**: `.github/workflows/ci.yml`

**Purpose**: Run quality checks (linting, testing, building) on pull requests

**Required Changes**:

1. Add pnpm setup step (must come before Node.js setup)
2. Configure Node.js with pnpm caching
3. Update install command to use pnpm
4. Add performance monitoring
5. Update all npm commands to pnpm equivalents

**Template**:

```yaml
name: Continuous Integration

on:
  pull_request:
    branches: [main]

jobs:
  quality-checks:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      # STEP 1: Setup pnpm (MUST come before setup-node for caching to work)
      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      # STEP 2: Setup Node.js with pnpm cache
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'pnpm'  # Changed from 'npm'

      # STEP 3: Install dependencies with performance monitoring
      - name: Install dependencies
        run: |
          START_TIME=$(date +%s)
          pnpm install --frozen-lockfile
          END_TIME=$(date +%s)
          DURATION=$((END_TIME - START_TIME))

          echo "### 📦 Dependency Installation Performance" >> $GITHUB_STEP_SUMMARY
          echo "" >> $GITHUB_STEP_SUMMARY
          echo "| Metric | Value |" >> $GITHUB_STEP_SUMMARY
          echo "|--------|-------|" >> $GITHUB_STEP_SUMMARY
          echo "| ⏱️ Duration | ${DURATION}s |" >> $GITHUB_STEP_SUMMARY
          echo "| 🎯 Target (cached) | <20s |" >> $GITHUB_STEP_SUMMARY
          echo "| 🎯 Target (changed) | <45s |" >> $GITHUB_STEP_SUMMARY
          echo "" >> $GITHUB_STEP_SUMMARY

          if [ $DURATION -gt 45 ]; then
            echo "⚠️ **WARNING**: Installation time exceeded 45s target" >> $GITHUB_STEP_SUMMARY
            echo "::warning::Dependency installation took ${DURATION}s, exceeding 45s target"
          elif [ $DURATION -gt 20 ]; then
            echo "ℹ️ **INFO**: Cache miss or lockfile change detected (${DURATION}s > 20s)" >> $GITHUB_STEP_SUMMARY
          else
            echo "✅ **SUCCESS**: Installation met cached target (<20s)" >> $GITHUB_STEP_SUMMARY
          fi

      # STEP 4: Prettier Check
      - name: Prettier Check
        run: pnpm run format:check  # Changed from 'npm run'

      # STEP 5: ESLint
      - name: ESLint
        run: pnpm run lint  # Changed from 'npm run'

      # STEP 6: Run Backend Tests
      - name: Run Backend Tests
        run: cd backend && pnpm test  # Changed from 'npm test'

      # STEP 7: Run Frontend Tests
      - name: Run Frontend Tests
        run: cd frontend && pnpm test  # Changed from 'npm test'

      # STEP 8: Build Frontend
      - name: Build Frontend
        run: cd frontend && pnpm run build  # Changed from 'npm run build'

      # STEP 9: Build Backend
      - name: Build Backend
        run: cd backend && pnpm run build  # Changed from 'npm run build'
```

**Performance Assertions**:
- Installation with cache hit: <20s (fail warning if >20s)
- Installation with lockfile change: <45s (fail warning if >45s)
- Total pipeline should be ~30s faster than npm baseline

**Error Handling**:
- `pnpm install --frozen-lockfile` fails if lockfile out of sync with package.json
- Warnings logged to GitHub Actions summary if performance targets missed
- All commands fail fast on error (default GitHub Actions behavior)

## Deployment Workflow Contract

**File**: `.github/workflows/deploy.yml`

**Purpose**: Deploy Firebase Functions and Frontend to production

**Firebase Functions Challenge**:
- Firebase CLI doesn't natively support pnpm workspaces
- Functions deployment expects flat node_modules structure
- Workspace dependencies (e.g., `shared` package) use `workspace:*` protocol incompatible with Firebase

**Solution**: Use `pnpm-isolate-workspace` to create isolated dependency tree for Functions

**Template**:

```yaml
name: Deploy to Firebase

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      # STEP 1: Setup pnpm
      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      # STEP 2: Setup Node.js with pnpm cache
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'pnpm'

      # STEP 3: Install dependencies with timing
      - name: Install dependencies
        run: |
          START_TIME=$(date +%s)
          pnpm install --frozen-lockfile
          END_TIME=$(date +%s)
          DURATION=$((END_TIME - START_TIME))

          echo "### 📦 Deployment Dependency Installation" >> $GITHUB_STEP_SUMMARY
          echo "" >> $GITHUB_STEP_SUMMARY
          echo "| Metric | Value |" >> $GITHUB_STEP_SUMMARY
          echo "|--------|-------|" >> $GITHUB_STEP_SUMMARY
          echo "| ⏱️ Duration | ${DURATION}s |" >> $GITHUB_STEP_SUMMARY
          echo "| 🎯 Target (cached) | <15s |" >> $GITHUB_STEP_SUMMARY
          echo "| 🎯 Target (uncached) | <30s |" >> $GITHUB_STEP_SUMMARY

      # STEP 4: Build Frontend
      - name: Build Frontend
        run: cd frontend && pnpm run build

      # STEP 5: Build Backend/Functions
      - name: Build Backend
        run: cd backend && pnpm run build

      # STEP 6: Isolate Functions workspace for Firebase deployment
      - name: Isolate Functions Dependencies
        run: |
          # Install pnpm-isolate-workspace tool
          pnpx pnpm-isolate-workspace backend

          # Copy built functions to isolated directory
          mkdir -p backend/_isolated_/dist
          cp -r backend/dist/* backend/_isolated_/dist/

          echo "✅ Functions isolated for Firebase deployment" >> $GITHUB_STEP_SUMMARY

      # STEP 7: Deploy to Firebase
      - name: Deploy to Firebase
        uses: w9jds/firebase-action@master
        with:
          args: deploy --only hosting,functions
        env:
          GCP_SA_KEY: ${{ secrets.GCP_SA_KEY }}
```

**Key Implementation Details**:

1. **pnpm-isolate-workspace**:
   - Converts `workspace:*` dependencies to relative file paths
   - Creates `_isolated_` directory with flattened dependencies
   - Maintains proper module resolution for Firebase Functions runtime

2. **Firebase.json Configuration**:
   ```json
   {
     "functions": {
       "source": "backend/_isolated_",
       "runtime": "nodejs20"
     }
   }
   ```
   - `source` points to isolated directory (not `backend/`)
   - Remove `predeploy` hooks (build happens before isolation)

3. **Build Sequence**:
   ```
   pnpm install → build all workspaces → isolate backend → copy dist → firebase deploy
   ```

4. **Authentication**:
   - Use `w9jds/firebase-action` with service account key
   - Requires `GCP_SA_KEY` secret with Firebase deployment permissions
   - No interactive browser login required in CI

**Performance Targets**:
- Cached install: <15s
- Uncached install: <30s
- Total deployment: <3 minutes (including build + deploy)

**Error Scenarios**:

| Error | Cause | Resolution |
|-------|-------|------------|
| `pnpm-isolate-workspace: command not found` | Tool not installed | Use `pnpx` to auto-install |
| `Firebase deploy failed: Cannot find module 'shared'` | Isolation didn't convert workspace:* | Verify `_isolated_/package.json` has relative paths |
| `Functions build failed` | Build step skipped | Ensure `pnpm run build` runs before isolation |
| `Authentication failed` | Missing/invalid GCP_SA_KEY | Check secret configuration in GitHub repo settings |

## Cache Behavior Contract

**Cache Key**: Hash of `pnpm-lock.yaml`

**Cache Location**: `~/.pnpm-store`

**Cache Lifecycle**:

1. **First run (cache miss)**:
   ```
   Restore cache: Not found
   pnpm install: Download all packages → Save to store → Link to node_modules
   Save cache: Upload ~/.pnpm-store
   Duration: 25-40s
   ```

2. **Subsequent run (cache hit, no changes)**:
   ```
   Restore cache: Success (~5-10s)
   pnpm install: Link from cache (no downloads)
   Save cache: Skipped (unchanged)
   Duration: 10-20s
   ```

3. **Lockfile changed (partial cache hit)**:
   ```
   Restore cache: Success (~5-10s)
   pnpm install: Download only changed packages → Update store → Link all
   Save cache: Upload updated store
   Duration: 20-45s
   ```

**Cache Invalidation**:
- Automatic when `pnpm-lock.yaml` changes
- Manual via GitHub Actions UI (delete cache)
- Automatic weekly cleanup of old caches

**Cache Size**:
- Expected: 100-300MB (vs 500MB+ for node_modules)
- Maximum: 500MB-1GB (GitHub Actions default limit: 10GB total)

## Validation Checklist

Before merging workflow changes, verify:

- [ ] pnpm/action-setup step exists and comes before setup-node
- [ ] setup-node has `cache: 'pnpm'` (not `cache: 'npm'`)
- [ ] All `npm` commands replaced with `pnpm`
- [ ] `npm ci` replaced with `pnpm install --frozen-lockfile`
- [ ] Performance timing instrumentation added
- [ ] GitHub Actions job summary reports metrics
- [ ] Firebase Functions use isolated workspace (if deploying functions)
- [ ] firebase.json source points to `_isolated_` directory
- [ ] GCP_SA_KEY secret configured for deployment
- [ ] All existing quality checks still execute (linting, testing, building)

## Migration Rollout Strategy

1. **PR for CI workflow**: Update CI first, validate on PR build
2. **Validate performance**: Confirm <20s cached, <45s changed targets met
3. **PR for Deploy workflow**: Update deployment after CI proven stable
4. **Monitor first deployment**: Watch for Firebase Functions issues
5. **Document fallback**: If isolation fails, document emergency revert process

## Summary

GitHub Actions workflows require five key changes:
1. Add pnpm/action-setup before setup-node
2. Configure pnpm caching via setup-node
3. Replace npm commands with pnpm equivalents
4. Add performance monitoring to job summaries
5. Use pnpm-isolate-workspace for Firebase Functions deployment

All changes maintain existing quality checks while achieving 50%+ performance improvement.
