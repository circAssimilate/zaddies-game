# Quickstart Guide: pnpm Migration

**Feature**: 002-migrate-to-pnpm
**Date**: 2025-10-26
**Audience**: Developers setting up the project after pnpm migration

## Prerequisites

- **Node.js**: 20.x or higher
- **pnpm**: 8.x or higher
- **Git**: For cloning the repository
- **Firebase CLI**: `pnpm install -g firebase-tools` (if working with backend/functions)

## Installing pnpm

### macOS/Linux

```bash
# Using npm (if you have Node.js installed)
npm install -g pnpm

# Using Homebrew (macOS)
brew install pnpm

# Using standalone script
curl -fsSL https://get.pnpm.io/install.sh | sh -
```

### Windows

```powershell
# Using npm
npm install -g pnpm

# Using standalone installer
iwr https://get.pnpm.io/install.ps1 -useb | iex
```

### Verify Installation

```bash
pnpm --version
# Should output: 8.x.x or higher
```

## Quick Start

### 1. Clone and Install

```bash
# Clone repository
git clone https://github.com/your-org/zaddies-game.git
cd zaddies-game

# Install all dependencies (root + all workspaces)
pnpm install

# Verify installation
pnpm test  # Should run tests in all workspaces
```

**Expected output**:

```
Scope: all 3 workspace projects
...
Progress: resolved 234, reused 234, downloaded 0, added 234, done
```

**First install timing**: ~20-30 seconds (depending on network)

### 2. Development

```bash
# Start frontend dev server + Firebase emulators
pnpm run dev

# Alternative: Start components separately
pnpm --filter frontend dev    # Frontend only (Vite dev server)
firebase emulators:start      # Backend only (Firebase emulators)
```

**Frontend dev server**: http://localhost:5173
**Firebase emulator UI**: http://localhost:4000

### 3. Testing

```bash
# Run all tests (frontend + backend + shared)
pnpm test

# Run tests in specific workspace
pnpm --filter frontend test
pnpm --filter backend test

# Watch mode
pnpm --filter frontend test:watch
```

### 4. Building

```bash
# Build all workspaces
pnpm run build

# Build specific workspace
pnpm --filter frontend build
pnpm --filter backend build
```

### 5. Code Quality

```bash
# Run all quality checks (format + lint + test)
pnpm run check

# Individual checks
pnpm run format        # Auto-format code
pnpm run format:check  # Check formatting without fixing
pnpm run lint          # Run ESLint
pnpm run lint:fix      # Auto-fix linting issues
```

## Common Commands

### Workspace Commands

```bash
# Run command in specific workspace
pnpm --filter <workspace-name> <command>

# Examples:
pnpm --filter frontend dev
pnpm --filter backend build
pnpm --filter shared test

# Run command in all workspaces (recursive)
pnpm -r <command>

# Examples:
pnpm -r build
pnpm -r test
pnpm -r clean
```

### Dependency Management

```bash
# Add dependency to specific workspace
pnpm --filter frontend add react-router-dom
pnpm --filter backend add express

# Add dev dependency
pnpm --filter frontend add -D @types/react-router-dom

# Add dependency to root (affects all workspaces)
pnpm add -D -w prettier  # -w = workspace root

# Remove dependency
pnpm --filter frontend remove react-router-dom

# Update dependencies
pnpm update              # Update all
pnpm update react        # Update specific package
pnpm update --latest     # Update to latest (ignoring semver)
```

### Workspace Dependencies

```bash
# Link local workspace package
# In frontend/package.json or backend/package.json:
{
  "dependencies": {
    "shared": "workspace:*"
  }
}

# This automatically links to the local shared workspace
# No need to manually install - pnpm handles it
```

## Troubleshooting

### "Please use pnpm" Error

**Problem**: Trying to use npm

```bash
$ npm install
npm ERR! Unsupported engine: wanted: {"npm":"please-use-pnpm"}
```

**Solution**: Use pnpm instead

```bash
pnpm install
```

### Phantom Dependency Error

**Problem**: Import working before, fails after pnpm migration

```typescript
// frontend/src/App.tsx
import something from 'some-package'; // ❌ Error: Cannot find module 'some-package'
```

**Cause**: Package was accessible via npm hoisting but not declared in package.json

**Solution**: Add missing dependency explicitly

```bash
pnpm --filter frontend add some-package
```

### Peer Dependency Warnings

**Problem**: Warnings about peer dependencies during install

```
WARN  Issues with peer dependencies found
├─┬ @chakra-ui/react
│ └── ✕ missing peer react@^18.0.0
```

**Solution**: Install missing peer dependency

```bash
pnpm --filter frontend add react@^18.0.0
```

**Alternative**: Enable auto-install in `.npmrc` (already configured):

```ini
auto-install-peers=true
```

### Cache Issues

**Problem**: Installation behaving unexpectedly

**Solution**: Clear pnpm cache

```bash
# Clear store cache
pnpm store prune

# Remove node_modules and reinstall
rm -rf node_modules frontend/node_modules backend/node_modules shared/node_modules
pnpm install
```

### Lockfile Out of Sync

**Problem**: `pnpm install --frozen-lockfile` fails in CI

```
ERR_PNPM_OUTDATED_LOCKFILE  Cannot install with "frozen-lockfile" because pnpm-lock.yaml is not up to date with package.json
```

**Solution**: Update lockfile locally and commit

```bash
pnpm install  # Updates pnpm-lock.yaml
git add pnpm-lock.yaml
git commit -m "Update pnpm lockfile"
```

### Firebase Functions Deployment

**Problem**: Firebase deploy fails with "Cannot find module 'shared'"

**Cause**: Firebase doesn't understand `workspace:*` protocol

**Solution**: Use isolation workflow (documented in contracts/github-actions.md)

```bash
# 1. Build functions
pnpm --filter backend build

# 2. Isolate workspace dependencies
pnpx pnpm-isolate-workspace backend

# 3. Copy built files to isolated directory
cp -r backend/dist/* backend/_isolated_/dist/

# 4. Deploy
firebase deploy --only functions
```

## Performance Expectations

### Installation Times

| Scenario                    | Expected Duration | Notes                             |
| --------------------------- | ----------------- | --------------------------------- |
| First install (no cache)    | 20-30s            | Downloading all packages          |
| Subsequent install (cached) | 5-10s             | Linking from cache                |
| After lockfile change       | 10-20s            | Downloading only changed packages |

**If significantly slower**: Check network connection, clear cache, or check for npm interference

### Disk Space Savings

```bash
# Check node_modules size across workspaces
du -sh node_modules frontend/node_modules backend/node_modules shared/node_modules

# Expected: ~30-50% smaller than npm due to hard linking
# npm: ~500-700MB total
# pnpm: ~300-400MB total
```

## CI/CD

### Running Tests Locally Like CI

```bash
# Simulate CI environment
pnpm install --frozen-lockfile  # Fails if lockfile out of sync
pnpm run format:check           # Formatting check
pnpm run lint                   # Linting
pnpm test                       # All tests
pnpm run build                  # All builds
```

### GitHub Actions

- CI automatically uses pnpm via `pnpm/action-setup@v2`
- Dependencies cached via `actions/setup-node` with `cache: 'pnpm'`
- Target: <20s install (cached), <45s (lockfile changes)

## Migration from npm

If you're switching from an npm-based setup:

```bash
# 1. Remove old lockfile and node_modules
rm -rf package-lock.json node_modules frontend/node_modules backend/node_modules shared/node_modules

# 2. Install pnpm globally
npm install -g pnpm

# 3. Install dependencies with pnpm
pnpm install

# 4. Verify everything works
pnpm test
pnpm run build

# 5. Commit new lockfile
git add pnpm-lock.yaml
git commit -m "Migrate to pnpm"
```

## Best Practices

### DO:

- ✅ Use `pnpm install` for adding/updating dependencies
- ✅ Commit `pnpm-lock.yaml` to git
- ✅ Use `--filter` to run commands in specific workspaces
- ✅ Use `workspace:*` protocol for local workspace dependencies
- ✅ Run `pnpm install --frozen-lockfile` in CI/CD

### DON'T:

- ❌ Use npm commands (blocked by engine-strict)
- ❌ Manually edit pnpm-lock.yaml
- ❌ Commit node_modules directories
- ❌ Use `npm install` even for global packages (use `pnpm install -g`)
- ❌ Delete pnpm-lock.yaml (required for reproducible builds)

## Additional Resources

- **pnpm Documentation**: https://pnpm.io
- **pnpm CLI Reference**: https://pnpm.io/cli/add
- **Workspace Documentation**: https://pnpm.io/workspaces
- **Filtering**: https://pnpm.io/filtering
- **GitHub Actions Integration**: https://pnpm.io/continuous-integration

## Getting Help

If you encounter issues not covered here:

1. Check `.npmrc` configuration
2. Verify `pnpm-workspace.yaml` lists all workspaces
3. Clear cache: `pnpm store prune`
4. Check GitHub Actions logs for CI failures
5. Consult specs/002-migrate-to-pnpm/contracts/ for detailed configuration

## Summary

**Key Commands**:

- `pnpm install` - Install all dependencies
- `pnpm run dev` - Start development environment
- `pnpm test` - Run all tests
- `pnpm run build` - Build all workspaces
- `pnpm --filter <workspace> <command>` - Run command in specific workspace

**Performance**: 2-3x faster than npm, 30-50% disk space savings

**Enforcement**: npm commands blocked via `.npmrc` and package.json engines field

Ready to code! 🚀
