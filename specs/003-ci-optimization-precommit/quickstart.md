# Quick Start: CI/CD Optimization and Pre-commit Quality Checks

**Feature**: 003-ci-optimization-precommit
**For**: Developers setting up or using pre-commit hooks and optimized CI workflows
**Last Updated**: 2025-10-25

## What This Feature Does

1. **Pre-commit Hooks**: Automatically run Prettier, ESLint, and TypeScript checks before allowing commits, catching issues locally
2. **Smart CI Workflows**: Skip unnecessary build and deployment steps when only documentation changes, reducing CI time and costs

## For Developers: First-Time Setup

### Automatic Installation (Recommended)

Pre-commit hooks install automatically when you run:

```bash
pnpm install
```

The `prepare` script in `package.json` runs `husky install` automatically, setting up git hooks for you.

**Verify Installation**:

```bash
# Check that hooks are installed
ls -la .husky/
# Should see: pre-commit

# Hooks should be executable
test -x .husky/pre-commit && echo "✅ Hook is executable" || echo "❌ Hook not executable"
```

### Manual Installation (If Needed)

If hooks didn't install automatically:

```bash
# Install Husky hooks
pnpm run prepare

# Or directly:
pnpm exec husky install
```

---

## For Developers: Daily Usage

### Making a Commit (Normal Flow)

```bash
# Stage your changes
git add src/components/NewComponent.tsx

# Commit (pre-commit checks run automatically)
git commit -m "feat: add new component"
```

**What Happens**:

1. Prettier formats your staged files (auto-fixes)
2. ESLint checks for code quality issues
3. TypeScript compiler checks for type errors
4. If all pass: Commit succeeds ✅
5. If any fail: Commit blocked ❌ (you'll see error details)

**Expected Time**: 10-45 seconds (depending on how many files changed)

### Understanding Check Failures

If your commit is blocked, you'll see output like:

```
❌ Pre-commit checks failed

✅ Prettier - PASSED (2.3s)
❌ ESLint - FAILED (5.1s)
   src/components/NewComponent.tsx:15:7
   'userName' is defined but never used  @typescript-eslint/no-unused-vars

❌ TypeScript - FAILED (18.2s)
   src/components/NewComponent.tsx:20:5
   Property 'onClick' does not exist on type 'ButtonProps'

🚫 Commit blocked - fix errors and try again
```

**Fix the errors**, then commit again. The checks will re-run.

### Bypassing Checks (Emergency Only)

If you need to commit urgently without running checks:

```bash
git commit --no-verify -m "emergency: hotfix for production"
```

⚠️ **Use sparingly** - bypassed commits will still fail in CI if they have errors.

---

## For Developers: Troubleshooting

### "Husky command not found"

**Cause**: Husky not installed or not in PATH

**Fix**:

```bash
pnpm install
pnpm exec husky install
```

### "Checks taking too long" (>60 seconds)

**Cause**: TypeScript compilation slow on large projects

**Temporary Workaround**:

```bash
# Use --no-verify to bypass hooks (not recommended)
git commit --no-verify -m "your message"
```

**Long-term Fix**: Optimize tsconfig.json (incremental compilation, project references)

### "lint-staged: command not found"

**Cause**: Dependencies not installed or node_modules corrupted

**Fix**:

```bash
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### "Prettier formatting conflicts with my editor"

**Cause**: Editor auto-formatting uses different config

**Fix**:

1. Install Prettier extension in your editor (VS Code, IntelliJ, etc.)
2. Configure editor to use project's `.prettierrc` file
3. Or disable editor auto-format and rely on pre-commit hooks

### "ESLint errors I don't understand"

**Cause**: Linting rules catching potential bugs or style violations

**Fix**:

```bash
# See detailed error explanation
pnpm run lint

# Auto-fix most issues
pnpm run lint:fix

# Then commit again
git commit -m "your message"
```

### "Pre-commit hook doesn't run"

**Cause**: Git hooks not executable or Husky not initialized

**Fix**:

```bash
# Re-initialize Husky
pnpm exec husky install

# Make hook executable
chmod +x .husky/pre-commit

# Verify it exists
cat .husky/pre-commit
```

### "TypeScript errors in files I didn't change"

**Cause**: Type-check runs on entire project, not just changed files

**Why**: This is intentional - ensures no breaking changes to other files

**Options**:

1. Fix the errors (recommended)
2. Use `--no-verify` for emergency commits (not recommended)
3. Ask team to fix type errors in their code

### "Permission denied: .husky/pre-commit"

**Cause**: Hook script not executable

**Fix**:

```bash
chmod +x .husky/pre-commit
```

### "lint-staged: command not found"

**Cause**: Dependencies not installed

**Fix**:

```bash
pnpm install
```

---

## For CI/CD: How Optimized Workflows Work

### Documentation-Only Changes

**Scenario**: You only modify `README.md` or files in `docs/`

**Old Behavior**: Full CI pipeline runs (5+ minutes)

**New Behavior** (using GitHub Actions `paths-ignore`):

- ⏭️ Lint workflow skipped (documentation excluded via `paths-ignore`)
- ⏭️ Frontend tests skipped
- ⏭️ Backend tests skipped
- ⏭️ Deployment skipped
- ⏱️ Total time: <30 seconds (no workflows run)

**How to Verify**:

1. Make a documentation-only change
2. Push to a PR
3. Check GitHub Actions tab - should show "No workflows ran"

### Frontend Code Changes

**Scenario**: You modify files in `frontend/**` or `shared/**`

**Behavior** (using GitHub Actions `paths`):

- ✅ Lint workflow runs (applies to all non-docs PRs)
- ✅ Frontend workflow runs (builds and tests frontend)
- ⏭️ Backend workflow skipped (backend code unchanged)
- ✅ Deployment runs when merged to main

### Backend Code Changes

**Scenario**: You modify files in `backend/**` or `shared/**`

**Behavior** (using GitHub Actions `paths`):

- ✅ Lint workflow runs (applies to all non-docs PRs)
- ⏭️ Frontend workflow skipped (frontend code unchanged)
- ✅ Backend workflow runs (builds and tests backend)
- ✅ Deployment runs when merged to main

### Shared Code Changes

**Scenario**: You modify files in `shared/**`

**Behavior**: Both frontend and backend workflows run (shared code affects both)

---

## For Contributors: Running Checks Manually

### Run All Pre-commit Checks

```bash
# Same checks that run during git commit
pnpm run precommit
```

### Run Individual Checks

```bash
# Just Prettier
pnpm run format

# Just ESLint
pnpm run lint

# Just TypeScript
pnpm exec tsc --noEmit
```

### Run Checks on Specific Files

```bash
# Format specific files
pnpm exec prettier --write src/components/Button.tsx

# Lint specific files
pnpm exec eslint src/components/Button.tsx

# TypeScript always checks entire project (can't isolate single file)
```

---

## Configuration Files

### Husky Configuration

**File**: `.husky/pre-commit`

**Contents**:

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

pnpm exec lint-staged && pnpm run type-check
```

**Modify**: Edit this file to change which commands run during pre-commit

### lint-staged Configuration

**File**: `package.json` (or `.lintstagedrc.json`)

**Contents**:

```json
{
  "lint-staged": {
    "*.{ts,tsx,js,jsx}": ["prettier --write", "eslint --fix"]
  }
}
```

**Modify**: Edit to change which commands run on staged files

### GitHub Actions Workflow Triggers

**Files**: `.github/workflows/*.yml`

**Purpose**: Define which file path changes trigger each workflow

**Modify**: Edit the `paths` or `paths-ignore` arrays if you add new directories or file types

**Example** (from `.github/workflows/frontend.yml`):

```yaml
on:
  pull_request:
    paths:
      - 'frontend/**'
      - 'shared/**'
      - 'package.json'
      - 'pnpm-lock.yaml'
      - 'pnpm-workspace.yaml'
```

---

## Performance Expectations

| Check               | Typical Time  | Maximum Allowed |
| ------------------- | ------------- | --------------- |
| Prettier            | 1-5 seconds   | 10 seconds      |
| ESLint              | 2-10 seconds  | 20 seconds      |
| TypeScript          | 10-30 seconds | 40 seconds      |
| **Total (typical)** | 13-45 seconds | 60 seconds      |

If checks consistently exceed maximums, file a performance bug report.

---

## Success Metrics

After this feature is implemented, we expect:

- ✅ 90% of errors caught locally before CI runs (SC-001)
- ✅ Pre-commit checks complete in <60 seconds (SC-002)
- ✅ Documentation-only CI runs in <2 minutes (SC-003)
- ✅ 80% fewer failed CI builds due to formatting/linting/types (SC-005)
- ✅ 95% of commits pass checks on first attempt (SC-007)

---

## Getting Help

**Pre-commit hook issues**:

- Check that Husky is installed: `pnpm list husky`
- Verify hook is executable: `ls -la .husky/pre-commit`
- Try manual install: `pnpm run prepare`

**CI workflow issues**:

- Check GitHub Actions tab to see which workflows ran
- If wrong workflow triggered, verify `paths` filters in workflow files
- Ensure workflows are using latest version from main branch

**Performance issues**:

- Profile TypeScript compilation: `pnpm exec tsc --noEmit --diagnostics`
- Check for large file counts: `git diff --cached --name-only | wc -l`
- Consider `--no-verify` for very large commits (then fix in separate commit)

---

## Next Steps

1. **After Setup**: Make a test commit to verify hooks work
2. **For New Features**: Pre-commit checks should catch issues before pushing
3. **For Reviews**: Expect fewer CI failures from formatting/linting/types
4. **For Maintenance**: Periodically review check performance and adjust patterns

---

**Related Documentation**:

- [Feature Specification](./spec.md) - What this feature does and why
- [Implementation Plan](./plan.md) - Technical approach
- [Research](./research.md) - Technology choices (Husky vs alternatives)
- [Data Model](./data-model.md) - How file categorization works
