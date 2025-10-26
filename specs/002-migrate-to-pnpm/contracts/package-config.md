# Package Configuration Contracts

**Feature**: 002-migrate-to-pnpm
**Date**: 2025-10-26
**Status**: Complete

## Overview

This document defines the contract for package.json, .npmrc, pnpm-workspace.yaml, and firebase.json configurations required for the pnpm migration.

## Root package.json Contract

**File**: `package.json` (repository root)

**Required Changes**:

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
    "lint:fix": "eslint \"**/*.{ts,tsx,js,jsx}\" --fix",
    "format": "prettier --write \"**/*.{ts,tsx,js,jsx,json,md}\"",
    "format:check": "prettier --check \"**/*.{ts,tsx,js,jsx,json,md}\"",
    "check": "pnpm run format:check && pnpm run lint && pnpm test"
  },

  "devDependencies": {
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "eslint": "^8.50.0",
    "eslint-config-prettier": "^9.0.0",
    "eslint-plugin-react": "^7.33.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "prettier": "^3.0.0",
    "typescript": "^5.3.0"
  }
}
```

**Key Changes**:

1. **engines.npm**: Set to `"please-use-pnpm"` (custom error message)
2. **engines.pnpm**: Added `">=8.0.0"` (enforce pnpm 8+)
3. **workspaces field**: REMOVED (moved to pnpm-workspace.yaml)
4. **scripts**: Updated to use pnpm-specific commands:
   - `npm run dev` → `pnpm --filter frontend dev` (workspace filtering)
   - `npm run build` → `pnpm -r build` (recursive for all workspaces)
   - `npm test` → `pnpm -r test` (recursive for all workspaces)
   - Other scripts remain unchanged (lint, format run at root level)

**Validation Rules**:
- ✅ engines.node >= 20.0.0 (project requirement)
- ✅ engines.pnpm >= 8.0.0 (migration target)
- ✅ engines.npm is NOT a valid semver version (triggers error with engine-strict)
- ✅ NO workspaces field (conflicts with pnpm-workspace.yaml)
- ✅ private: true (required for workspaces root)

## Workspace package.json Contract

**Files**: `frontend/package.json`, `backend/package.json`, `shared/package.json`

**Backend package.json** (Firebase Functions):

```json
{
  "name": "backend",
  "version": "1.0.0",
  "private": true,
  "main": "dist/index.js",

  "engines": {
    "node": ">=20.0.0",
    "pnpm": ">=8.0.0"
  },

  "scripts": {
    "build": "tsc",
    "watch": "tsc --watch",
    "serve": "firebase emulators:start --only functions",
    "shell": "firebase functions:shell",
    "logs": "firebase functions:log"
  },

  "dependencies": {
    "firebase-admin": "^11.8.0",
    "firebase-functions": "^4.1.1",
    "shared": "workspace:*"
  },

  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.3.0",
    "vitest": "^0.34.0"
  }
}
```

**Frontend package.json**:

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
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  },

  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@chakra-ui/react": "^2.8.0",
    "@emotion/react": "^11.11.0",
    "@emotion/styled": "^11.11.0",
    "firebase": "^10.0.0",
    "shared": "workspace:*"
  },

  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@vitejs/plugin-react": "^4.0.0",
    "typescript": "^5.3.0",
    "vite": "^5.4.0",
    "vitest": "^0.34.0"
  }
}
```

**Shared package.json**:

```json
{
  "name": "shared",
  "version": "1.0.0",
  "private": true,

  "engines": {
    "node": ">=20.0.0",
    "pnpm": ">=8.0.0"
  },

  "main": "index.ts",

  "scripts": {
    "test": "vitest run"
  },

  "devDependencies": {
    "typescript": "^5.3.0",
    "vitest": "^0.34.0"
  }
}
```

**Critical Requirements**:

1. **name field**: MANDATORY for workspace resolution (pnpm requires it)
2. **main field**: Required for backend (Firebase Functions entry point)
3. **engines.pnpm**: Should match root or be >= root version
4. **workspace:* protocol**: Used for local workspace dependencies
   - `"shared": "workspace:*"` means "use local workspace, any version"
   - Alternative: `"workspace:^"` (must match semver range)
5. **private: true**: Prevents accidental publishing to npm

**Workspace Dependency Resolution**:

```json
// Before pnpm-isolate-workspace
"dependencies": {
  "shared": "workspace:*"
}

// After pnpm-isolate-workspace (in backend/_isolated_/package.json)
"dependencies": {
  "shared": "file:../../shared"
}
```

## .npmrc Contract

**File**: `.npmrc` (repository root)

**Required Configuration**:

```ini
# Enforce pnpm usage (works with package.json engines field)
engine-strict=true

# pnpm-specific: strict node_modules structure (prevents phantom dependencies)
shamefully-hoist=false

# pnpm-specific: auto-install peer dependencies to reduce warnings
auto-install-peers=true

# pnpm-specific: warn on peer dependency mismatches but don't fail
strict-peer-dependencies=false

# Workspace behavior: prefer local workspace packages over registry
link-workspace-packages=true
prefer-workspace-packages=true

# Registry (default, can be overridden for private registries)
registry=https://registry.npmjs.org/
```

**Field Explanations**:

| Field | Value | Purpose |
|-------|-------|---------|
| `engine-strict` | `true` | Combined with package.json engines, blocks npm usage |
| `shamefully-hoist` | `false` | Prevents dependency hoisting, enforces strict resolution |
| `auto-install-peers` | `true` | Automatically installs peer dependencies (convenience) |
| `strict-peer-dependencies` | `false` | Warns on peer mismatches but doesn't fail (compatibility) |
| `link-workspace-packages` | `true` | Links local workspace packages instead of downloading from registry |
| `prefer-workspace-packages` | `true` | Uses workspace version when semver range matches |
| `registry` | npm URL | Package download source (can be private registry) |

**Error Message When npm Used**:

```bash
$ npm install
npm ERR! code ENGINES
npm ERR! Unsupported engine for zaddies-game@1.0.0: wanted: {"npm":"please-use-pnpm"} (current: {"npm":"10.2.0"})
npm ERR! Please use pnpm instead of npm.
npm ERR!
npm ERR! Run "npm install -g pnpm" to install pnpm globally
npm ERR! Then run "pnpm install" to install dependencies

npm ERR! A complete log of this run can be found in: ~/.npm/_logs/2025-10-26T00_00_00_000Z-debug.log
```

**Optional Advanced Settings** (not required for basic migration):

```ini
# Lockfile settings
lockfile=true
lockfile-only=false

# Performance
fetch-retries=2
fetch-timeout=60000

# Security
verify-store-integrity=true

# Logging
loglevel=info
```

## pnpm-workspace.yaml Contract

**File**: `pnpm-workspace.yaml` (repository root)

**Required Configuration**:

```yaml
packages:
  - 'frontend'
  - 'backend'
  - 'shared'
```

**Alternative Patterns** (if workspace structure changes):

```yaml
# Glob patterns for scalability
packages:
  - 'packages/*'
  - 'apps/*'
  - '!**/test/**'  # Exclusion pattern

# Current explicit list (clearer for small monorepo)
packages:
  - 'frontend'
  - 'backend'
  - 'shared'
```

**Validation Rules**:
- ✅ All paths relative to repository root
- ✅ No overlapping paths (no nested workspaces)
- ✅ Each path contains valid package.json with "name" field
- ✅ All workspace names unique across monorepo

**Error Scenarios**:

| Error | Cause | Fix |
|-------|-------|-----|
| `ERR_PNPM_NO_MATCHING_VERSION` | Workspace not found | Verify path in pnpm-workspace.yaml |
| `ERR_PNPM_WORKSPACE_PKG_NOT_FOUND` | Missing package.json | Add package.json to workspace directory |
| `ERR_PNPM_DUPLICATE_WORKSPACE_NAME` | Two workspaces same name | Rename one workspace in package.json |

## firebase.json Contract

**File**: `firebase.json` (repository root)

**Required Changes for pnpm**:

```json
{
  "hosting": {
    "public": "frontend/dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  },
  "functions": {
    "source": "backend/_isolated_",
    "runtime": "nodejs20",
    "ignore": [
      "node_modules",
      ".git",
      "firebase-debug.log",
      "firebase-debug.*.log"
    ]
  },
  "emulators": {
    "functions": {
      "port": 5001
    },
    "hosting": {
      "port": 5000
    },
    "ui": {
      "enabled": true,
      "port": 4000
    }
  }
}
```

**Critical Changes**:

1. **functions.source**: Changed from `"backend"` to `"backend/_isolated_"`
   - Points to isolated workspace directory created by pnpm-isolate-workspace
   - Contains flattened dependencies compatible with Firebase deployment

2. **Remove predeploy hooks** (if present):
   ```json
   // REMOVE THIS:
   "functions": {
     "predeploy": [
       "npm --prefix \"$RESOURCE_DIR\" run lint",
       "npm --prefix \"$RESOURCE_DIR\" run build"
     ]
   }
   ```
   - Build happens before isolation in CI/CD
   - Predeploy runs inside _isolated_ directory where build is already complete

3. **runtime**: Ensure matches Node.js version (e.g., `"nodejs20"`)

**Deployment Flow**:

```
1. pnpm install (install all workspaces)
2. pnpm -r build (build all workspaces, including backend → backend/dist)
3. pnpx pnpm-isolate-workspace backend (create backend/_isolated_)
4. cp -r backend/dist backend/_isolated_/dist (copy built files)
5. firebase deploy --only functions (deploys from _isolated_ directory)
```

**Why Isolation is Required**:

Firebase Functions deployment:
1. Reads `firebase.json` → finds `functions.source` → `backend/_isolated_`
2. Looks for `package.json` in source directory
3. Runs `npm install --production` inside source (ignores pnpm)
4. Bundles node_modules + code for deployment

Without isolation:
- `backend/package.json` has `"shared": "workspace:*"`
- npm doesn't understand `workspace:*` protocol
- Deployment fails: `Cannot find module 'shared'`

With isolation:
- `backend/_isolated_/package.json` has `"shared": "file:../../shared"`
- npm understands `file:` protocol
- Shared code bundled correctly in deployment

## Migration Validation Checklist

Before committing pnpm migration:

### Configuration Files

- [ ] `package.json` (root): engines.npm = "please-use-pnpm"
- [ ] `package.json` (root): engines.pnpm >= 8.0.0
- [ ] `package.json` (root): NO workspaces field
- [ ] `package.json` (root): Scripts use pnpm commands (pnpm -r, pnpm --filter)
- [ ] `package.json` (workspaces): All have name field
- [ ] `package.json` (workspaces): All have engines.pnpm
- [ ] `package.json` (backend): Has main field pointing to dist/index.js
- [ ] `package.json` (backend): Uses "workspace:*" for shared dependency
- [ ] `.npmrc`: engine-strict=true
- [ ] `.npmrc`: shamefully-hoist=false
- [ ] `.npmrc`: auto-install-peers=true
- [ ] `pnpm-workspace.yaml`: Lists all three workspaces
- [ ] `firebase.json`: functions.source = "backend/_isolated_"
- [ ] `firebase.json`: NO predeploy hooks for functions

### Lockfiles

- [ ] `pnpm-lock.yaml`: Exists and committed
- [ ] `package-lock.json`: DELETED
- [ ] `pnpm-lock.yaml`: Contains all three workspace importers
- [ ] Dependency versions match between old npm and new pnpm lockfiles

### Scripts

- [ ] `pnpm install`: Works from root
- [ ] `pnpm test`: Runs tests in all workspaces
- [ ] `pnpm run build`: Builds all workspaces
- [ ] `pnpm --filter frontend dev`: Starts frontend dev server
- [ ] `pnpm --filter backend build`: Builds backend only
- [ ] `pnpm -r lint`: Runs linting across workspaces (if applicable)

### Firebase Functions

- [ ] `pnpx pnpm-isolate-workspace backend`: Creates _isolated_ directory
- [ ] `backend/_isolated_/package.json`: Has file: protocol for shared
- [ ] `backend/_isolated_/dist`: Contains built functions after copy
- [ ] `firebase deploy --only functions`: Deploys successfully

### npm Prevention

- [ ] `npm install`: Shows error message "please-use-pnpm"
- [ ] Error message is clear and actionable
- [ ] `pnpm install`: Works correctly
- [ ] `.npmrc` engine-strict setting enforced

## Summary

Package configuration for pnpm migration requires:

1. **package.json updates**: engines enforcement, workspace:* protocol, pnpm commands
2. **.npmrc creation**: engine-strict + pnpm-specific settings
3. **pnpm-workspace.yaml creation**: explicit workspace list
4. **firebase.json update**: source = "_isolated_" for Functions deployment
5. **Isolation workflow**: Use pnpm-isolate-workspace for Firebase compatibility

All configurations enforce pnpm-only usage while maintaining compatibility with existing build tools and Firebase deployment.
