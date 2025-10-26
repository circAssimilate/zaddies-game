# Data Model: Package Manager Migration to pnpm

**Feature**: 002-migrate-to-pnpm
**Date**: 2025-10-26
**Status**: Complete

## Overview

This document defines the data structures and configuration schemas for the pnpm migration. Unlike application features, this migration primarily involves configuration files and lockfile formats rather than application data models.

## Configuration Entities

### 1. Package Manager Lockfile

**Purpose**: Record exact dependency versions and resolution metadata for reproducible installations

**npm lockfile** (`package-lock.json` - to be removed):
```json
{
  "name": "zaddies-game",
  "version": "1.0.0",
  "lockfileVersion": 3,
  "requires": true,
  "packages": {
    "": {
      "name": "zaddies-game",
      "version": "1.0.0",
      "workspaces": ["frontend", "backend", "shared"],
      "devDependencies": {
        "typescript": "^5.3.0"
      }
    },
    "node_modules/typescript": {
      "version": "5.3.3",
      "resolved": "https://registry.npmjs.org/typescript/-/typescript-5.3.3.tgz",
      "integrity": "sha512-...",
      "dev": true
    }
  }
}
```

**pnpm lockfile** (`pnpm-lock.yaml` - new):
```yaml
lockfileVersion: '6.0'

settings:
  autoInstallPeers: true
  excludeLinksFromLockfile: false

importers:
  .:
    devDependencies:
      typescript:
        specifier: ^5.3.0
        version: 5.3.3

  frontend:
    dependencies:
      react:
        specifier: ^18.0.0
        version: 18.2.0
    devDependencies:
      vite:
        specifier: ^5.0.0
        version: 5.4.21

packages:
  /typescript@5.3.3:
    resolution: {integrity: sha512-...}
    engines: {node: '>=14.17'}
    hasBin: true
    dev: true
```

**Key differences**:
- **Format**: JSON (npm) vs YAML (pnpm)
- **Structure**: Flat node_modules tree (npm) vs importers + packages (pnpm)
- **Workspace handling**: Single packages object (npm) vs separate importers per workspace (pnpm)
- **Metadata**: pnpm includes settings section for configuration

**Validation rules**:
- Lockfile MUST be committed to git
- Lockfile MUST NOT be manually edited
- Version resolution MUST be deterministic across platforms
- Integrity hashes MUST match for security

### 2. Package Configuration

**Root `package.json`** (modified):
```json
{
  "name": "zaddies-game",
  "version": "1.0.0",
  "private": true,
  "description": "Texas Hold'em Poker game for friend groups",

  "engines": {
    "node": ">=20.0.0",
    "npm": "please-use-pnpm",
    "pnpm": ">=8.0.0"
  },

  "scripts": {
    "dev": "pnpm --filter frontend dev & firebase emulators:start",
    "build": "pnpm -r build",
    "test": "pnpm -r test",
    "lint": "eslint \"**/*.{ts,tsx,js,jsx}\"",
    "format": "prettier --write \"**/*.{ts,tsx,js,jsx,json,md}\""
  },

  "devDependencies": {
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "typescript": "^5.3.0"
  }
}
```

**Changes from npm version**:
- **Added**: `engines.pnpm` field (enforces pnpm version)
- **Modified**: `engines.npm` with error message
- **Removed**: `workspaces` field (moved to pnpm-workspace.yaml)
- **Updated**: Script commands to use pnpm-specific syntax (`pnpm -r`, `pnpm --filter`)

**Workspace `package.json`** (frontend/backend/shared):
```json
{
  "name": "frontend",
  "version": "1.0.0",
  "private": true,

  "engines": {
    "node": ">=20.0.0",
    "pnpm": ">=8.0.0"
  },

  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "test": "vitest run"
  },

  "dependencies": {
    "react": "^18.0.0"
  }
}
```

**Inheritance**:
- Workspace packages inherit node version from root
- Workspace packages can override engines if needed
- devDependencies in workspaces only affect that workspace

### 3. Package Manager Configuration

**`.npmrc`** (new/modified):
```ini
# Enforce pnpm usage
engine-strict=true

# pnpm-specific settings
shamefully-hoist=false
auto-install-peers=true
strict-peer-dependencies=false

# Registry configuration (if needed)
registry=https://registry.npmjs.org/

# Workspace settings
link-workspace-packages=true
prefer-workspace-packages=true
```

**Field explanations**:
- `engine-strict=true`: Enforces package.json engines field (blocks npm)
- `shamefully-hoist=false`: Maintains strict node_modules isolation (prevents phantom dependencies)
- `auto-install-peers=true`: Automatically install peer dependencies to reduce warnings
- `strict-peer-dependencies=false`: Don't fail on peer dependency mismatches (warn only)
- `link-workspace-packages=true`: Link local workspace packages instead of downloading from registry
- `prefer-workspace-packages=true`: Use local workspace version when version range matches

**Security considerations**:
- Registry URLs should use HTTPS only
- Consider using lock-file-only mode in CI: `pnpm install --frozen-lockfile`

### 4. Workspace Configuration

**`pnpm-workspace.yaml`** (new):
```yaml
packages:
  - 'frontend'
  - 'backend'
  - 'shared'
```

**Alternative patterns**:
```yaml
# Glob patterns (if scaling to many packages)
packages:
  - 'packages/*'
  - 'apps/*'
  - '!**/test/**'  # Exclusion

# Explicit list (current approach - clearer for small monorepo)
packages:
  - 'frontend'
  - 'backend'
  - 'shared'
```

**Validation rules**:
- All paths MUST be relative to repository root
- Paths MUST NOT overlap (no nested workspaces)
- Each path MUST contain a valid package.json
- Workspace names MUST be unique

### 5. CI/CD Workflow Configuration

**GitHub Actions workflow** (`.github/workflows/ci.yml` and `.github/workflows/deploy.yml`):
```yaml
jobs:
  quality-checks:
    runs-on: ubuntu-latest
    steps:
      # 1. Setup pnpm (before Node.js setup for cache to work)
      - uses: pnpm/action-setup@v2
        with:
          version: 8

      # 2. Setup Node.js with pnpm caching
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'pnpm'

      # 3. Install dependencies with timing measurement
      - name: Install dependencies
        run: |
          START_TIME=$(date +%s)
          pnpm install --frozen-lockfile
          END_TIME=$(date +%s)
          DURATION=$((END_TIME - START_TIME))
          echo "### Dependency Installation Time" >> $GITHUB_STEP_SUMMARY
          echo "⏱️ Duration: ${DURATION}s" >> $GITHUB_STEP_SUMMARY
          echo "🎯 Target: <20s (cached), <45s (changed)" >> $GITHUB_STEP_SUMMARY

      # 4. Run tests
      - name: Run tests
        run: pnpm test

      # 5. Build
      - name: Build
        run: pnpm run build
```

**Key changes from npm version**:
- **Added**: `pnpm/action-setup@v2` step (must come before setup-node)
- **Modified**: `cache: 'npm'` → `cache: 'pnpm'`
- **Modified**: `npm ci` → `pnpm install --frozen-lockfile`
- **Modified**: `npm test` → `pnpm test`
- **Modified**: `npm run build` → `pnpm run build`
- **Added**: Timing instrumentation for performance monitoring

**Cache behavior**:
- Cache key: Hash of `pnpm-lock.yaml`
- Cache location: `~/.pnpm-store` (global pnpm store)
- Cache size: Typically 100-300MB (vs 500MB+ for node_modules caching)
- Cache restoration: Automatic when `cache: 'pnpm'` specified

## State Transitions

### Migration Lifecycle

```
[Start] → [Backup npm state] → [Import lockfile] → [Verify equivalence] → [Test suite] → [Update CI/CD] → [Update docs] → [Commit] → [Merged]
```

**State definitions**:
1. **Start**: Repository using npm, package-lock.json exists
2. **Backup npm state**: Git commit with clean npm state as baseline
3. **Import lockfile**: `pnpm import` creates pnpm-lock.yaml
4. **Verify equivalence**: Compare dependency versions between npm and pnpm
5. **Test suite**: Run all tests to ensure parity
6. **Update CI/CD**: Modify workflows to use pnpm
7. **Update docs**: Change all documentation references
8. **Commit**: Single commit with all changes (atomic migration)
9. **Merged**: Migration complete, npm state removed

**Rollback (NOT SUPPORTED)**:
- Per clarification: Migration is permanent, no rollback mechanism
- If critical issues found post-merge, forward-fix required
- Pre-merge validation critical to avoid post-merge issues

### Dependency Installation States

```
[No node_modules] → [pnpm install] → [Linking] → [Complete]
                                    ↓
                         [Cached store available]
                                    ↓
                              [Fast restore]
```

**States**:
- **No node_modules**: Fresh clone or after `rm -rf node_modules`
- **pnpm install**: Downloads packages to global store if not cached
- **Linking**: Creates hard links from store to project node_modules
- **Cached store available**: Packages already in `~/.pnpm-store`
- **Fast restore**: Skip download, just link from cache
- **Complete**: node_modules ready, build/test can proceed

## Validation Rules

### Lockfile Integrity

1. **Version equivalence**: All dependency versions MUST match between npm and pnpm lockfiles (before migration)
2. **Integrity hashes**: All packages MUST have valid SHA-512 integrity hashes
3. **Reproducibility**: `pnpm install` MUST produce identical node_modules across machines
4. **Workspace consistency**: Workspace dependencies MUST resolve to local packages when versions match

### Configuration Validity

1. **engines.pnpm**: MUST be `>=8.0.0` (current major version)
2. **engines.npm**: MUST contain error message (e.g., "please-use-pnpm")
3. **engines.node**: MUST be `>=20.0.0` (project requirement)
4. **pnpm-workspace.yaml**: MUST list all workspace directories
5. **.npmrc**: MUST include `engine-strict=true`

### Performance Constraints

1. **CI cached install**: MUST complete in <20s (measured in GitHub Actions)
2. **CI lockfile change**: MUST complete in <45s (50% improvement from npm ~90s)
3. **Deployment cached**: MUST complete in <15s
4. **Deployment uncached**: MUST complete in <30s
5. **Cache hit rate**: MUST achieve >80% in CI (4 out of 5 builds use cache)

## Relationships

```
Root package.json
  ├── references → pnpm-workspace.yaml (workspace definitions)
  ├── enforces → .npmrc (via engines.npm + engine-strict)
  └── coordinates → Workspace package.json files

pnpm-lock.yaml
  ├── generated from → package.json + workspace package.json files
  ├── consumed by → pnpm install command
  └── cached in → GitHub Actions via actions/setup-node

.npmrc
  ├── applies to → pnpm commands globally
  └── enforces → package.json engines field

GitHub Actions workflows
  ├── use → pnpm/action-setup action
  ├── cache → ~/.pnpm-store directory
  └── report to → GitHub Actions job summaries
```

## Summary

The data model for this migration consists primarily of configuration files and lockfile formats. Key entities are:

1. **Lockfile** (pnpm-lock.yaml): Dependency resolution metadata
2. **Package configuration** (package.json): Project metadata + engines enforcement
3. **Manager configuration** (.npmrc): pnpm-specific settings + npm prevention
4. **Workspace configuration** (pnpm-workspace.yaml): Monorepo structure
5. **CI/CD configuration** (GitHub Actions): Automation + performance tracking

All entities have clear validation rules and state transitions defined to ensure zero-regression migration.
