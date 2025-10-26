# Tasks: Package Manager Migration to pnpm

**Input**: Design documents from `/specs/002-migrate-to-pnpm/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: No automated test tasks required - validation is manual performance measurement

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Baseline Validation)

**Purpose**: Establish baseline performance metrics and prepare for migration

- [X] T001 Measure current npm installation times in CI workflow (add timing to .github/workflows/ci.yml temporarily)
- [X] T002 Measure current npm installation times in deployment workflow (add timing to .github/workflows/deploy.yml temporarily)
- [X] T003 Capture current dependency versions with `npm ls --all --json > baseline-npm-deps.json`
- [X] T004 Install pnpm globally on development machine for testing: `npm install -g pnpm@8`
- [X] T005 [P] Create backup branch from main before migration: `git checkout -b backup-npm-baseline`

**Checkpoint**: Baseline metrics captured - ready for migration

---

## Phase 2: Foundational (Core pnpm Migration)

**Purpose**: Core migration tasks that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T006 Import npm lockfile to pnpm: run `pnpm import` from repository root to generate pnpm-lock.yaml
- [X] T007 Verify lockfile equivalence: compare `npm ls --all --json` vs `pnpm ls --depth=100 --json` for version parity
- [X] T008 Create .npmrc configuration file in repository root with engine-strict=true, shamefully-hoist=false, auto-install-peers=true
- [X] T009 Update root package.json engines field: set engines.npm="please-use-pnpm", engines.pnpm=">=8.0.0"
- [X] T010 Remove workspaces field from root package.json (will be replaced by pnpm-workspace.yaml)
- [X] T011 Create pnpm-workspace.yaml in repository root with packages: ['frontend', 'backend', 'shared']
- [X] T012 [P] Add engines.pnpm=">=8.0.0" to frontend/package.json
- [X] T013 [P] Add engines.pnpm=">=8.0.0" to backend/package.json
- [X] T014 [P] Add engines.pnpm=">=8.0.0" to shared/package.json
- [X] T015 Add main="dist/index.js" to backend/package.json (required for Firebase Functions)
- [X] T016 Update backend/package.json dependencies: change "shared" to use "workspace:*" protocol
- [X] T017 Update frontend/package.json dependencies: change "shared" to use "workspace:*" protocol
- [X] T018 Update root package.json scripts: change "dev" to `pnpm --filter frontend dev & firebase emulators:start`
- [X] T019 Update root package.json scripts: change "build" to `pnpm -r build`
- [X] T020 Update root package.json scripts: change "test" to `pnpm -r test`
- [X] T021 Update root package.json scripts: change "check" to `pnpm run format:check && pnpm run lint && pnpm test`
- [X] T022 Test local installation: run `pnpm install` from root and verify all workspaces install correctly
- [X] T023 Verify all existing tests pass: run `pnpm test` and confirm 72/72 tests pass with identical results to npm
- [X] T024 Verify all builds succeed: run `pnpm run build` and confirm frontend and backend build successfully
- [X] T025 Verify linting passes: run `pnpm run lint` and confirm zero errors
- [X] T026 Verify npm prevention works: attempt `npm install` and confirm error message shows "please-use-pnpm"
- [X] T027 Delete package-lock.json from repository root after validation
- [X] T028 Install isolate-package for Firebase Functions deployment: `pnpm add -D isolate-package`
- [X] T029 Update firebase.json functions.source to point to "backend/_isolated_" instead of "backend"
- [X] T030 Test Firebase Functions isolation: run `pnpm deploy --filter backend --prod backend/_isolated_` and verify backend/_isolated_ directory created
- [X] T031 Verify isolated Functions deploy locally: test with Firebase emulators

**Checkpoint**: Foundation ready - pnpm migration core complete, user story implementation can begin

---

## Phase 3: User Story 1 - CI/CD Pipeline Efficiency (Priority: P1) 🎯 MVP

**Goal**: Update CI and deployment workflows to use pnpm with caching for 50%+ installation time improvement

**Independent Test**: Trigger CI workflow on a PR and deployment workflow on main merge, measure installation times, verify <20s cached (CI), <45s changed (CI), <15s cached (deploy), <30s uncached (deploy)

### Implementation for User Story 1

- [X] T032 [US1] Update .github/workflows/ci.yml: add pnpm/action-setup@v2 step before setup-node with version: 8
- [X] T033 [US1] Update .github/workflows/ci.yml: change setup-node cache from 'npm' to 'pnpm'
- [X] T034 [US1] Update .github/workflows/ci.yml: replace `npm ci` with `pnpm install --frozen-lockfile` and add timing instrumentation
- [X] T035 [US1] Add performance monitoring to .github/workflows/ci.yml Install dependencies step: capture START_TIME, END_TIME, calculate DURATION, write to $GITHUB_STEP_SUMMARY
- [X] T036 [US1] Update .github/workflows/ci.yml: replace all `npm run` commands with `pnpm run`
- [X] T037 [US1] Update .github/workflows/ci.yml: replace `npm test` with `pnpm test` in backend and frontend test steps
- [X] T038 [US1] Update .github/workflows/deploy.yml: add pnpm/action-setup@v2 step before setup-node with version: 8
- [X] T039 [US1] Update .github/workflows/deploy.yml: change setup-node cache from 'npm' to 'pnpm'
- [X] T040 [US1] Update .github/workflows/deploy.yml: replace `npm ci` with `pnpm install --frozen-lockfile` and add timing instrumentation
- [X] T041 [US1] Add performance monitoring to .github/workflows/deploy.yml Install dependencies step similar to CI workflow
- [X] T042 [US1] Add Firebase Functions isolation step to .github/workflows/deploy.yml: run `pnpm deploy --filter backend --prod backend/_isolated_` after build
- [X] T043 [US1] Update .github/workflows/deploy.yml: copy built functions to isolated directory (handled by pnpm deploy)
- [X] T044 [US1] Update .github/workflows/deploy.yml: ensure firebase deploy uses isolated backend directory
- [ ] T045 [US1] Commit workflow changes and push to trigger CI validation
- [ ] T046 [US1] Monitor first CI run: verify installation time <20s (cached) or <45s (lockfile changes)
- [ ] T047 [US1] Monitor first deployment run: verify installation time <15s (cached) or <30s (uncached)
- [ ] T048 [US1] Verify GitHub Actions job summary shows performance metrics table with duration and targets
- [ ] T049 [US1] Validate cache hit rate over 5 CI runs: should be >=80% (4 out of 5 use cache)

**Checkpoint**: At this point, User Story 1 should be fully functional - CI/CD uses pnpm with measurable performance improvements

---

## Phase 4: User Story 2 - Developer Dependency Installation (Priority: P2)

**Goal**: Update developer documentation and validate local development workflow with pnpm

**Independent Test**: Fresh clone repository, run `pnpm install`, verify installation <30s, build and test successfully

### Implementation for User Story 2

- [X] T050 [US2] Update README.md: replace "npm 10.x or higher" with "pnpm 8.x or higher" in prerequisites
- [X] T051 [US2] Update README.md: replace `npm install` with `pnpm install` in installation section
- [X] T052 [US2] Update README.md: replace all `npm run` commands with `pnpm run` or `pnpm --filter` commands
- [X] T053 [US2] Update README.md: add pnpm global installation instructions for macOS, Linux, Windows
- [X] T054 [US2] Update README.md: add troubleshooting section for "please-use-pnpm" error message
- [ ] T055 [US2] Update specs/001-texas-holdem-poker/quickstart.md: replace npm commands with pnpm equivalents
- [ ] T056 [US2] Update specs/001-texas-holdem-poker/quickstart.md: update dependency installation steps to use pnpm install
- [ ] T057 [US2] Update specs/001-texas-holdem-poker/quickstart.md: update workspace commands to use pnpm --filter syntax
- [ ] T058 [US2] Update specs/001-texas-holdem-poker/contracts/api-functions.md: replace `npm ci` examples with `pnpm install`
- [X] T059 [US2] Update CLAUDE.md: change "npm test && npm run lint" to "pnpm test && pnpm run lint"
- [X] T060 [US2] Test fresh clone scenario: clone repo to new directory, run `pnpm install`, verify <30s and successful
- [X] T061 [US2] Test lockfile update scenario: modify a dependency version, run `pnpm install`, verify only changed packages download
- [X] T062 [US2] Test clean install scenario: delete node_modules, run `pnpm install`, verify no conflicts
- [X] T063 [US2] Test branch switching scenario: switch between branches with different dependencies, verify pnpm updates correctly

**Checkpoint**: At this point, User Story 2 should be fully functional - developers can use pnpm for local development with updated docs

---

## Phase 5: User Story 3 - Workspace Management (Priority: P3)

**Goal**: Validate and document pnpm workspace-specific features and optimizations

**Independent Test**: Add dependency to one workspace, verify isolation, measure disk space savings, confirm >30% reduction vs npm

### Implementation for User Story 3

- [ ] T064 [US3] Create pnpm workspace documentation in specs/002-migrate-to-pnpm/quickstart.md: document workspace commands (pnpm --filter, pnpm -r)
- [ ] T065 [US3] Document workspace dependency management in quickstart.md: explain workspace:* protocol and how it links local packages
- [ ] T066 [US3] Document workspace-specific install in quickstart.md: `pnpm --filter frontend add <package>` syntax
- [ ] T067 [US3] Document recursive commands in quickstart.md: `pnpm -r build`, `pnpm -r test` usage
- [ ] T068 [US3] Test workspace isolation: add a dependency to frontend only, verify it's not in backend/shared
- [ ] T069 [US3] Test shared package updates: modify shared package, run `pnpm -r build`, verify frontend and backend reference updated version
- [ ] T070 [US3] Test workspace-specific tests: run `pnpm --filter frontend test`, verify only frontend tests execute
- [ ] T071 [US3] Measure disk space savings: compare total node_modules size (root + all workspaces) between npm baseline and pnpm
- [ ] T072 [US3] Verify disk space reduction >=30%: calculate `(npm_size - pnpm_size) / npm_size * 100` and confirm >=30%
- [ ] T073 [US3] Document disk space savings in quickstart.md troubleshooting section
- [ ] T074 [US3] Add workspace best practices to quickstart.md: DO/DON'T section for workspace management

**Checkpoint**: At this point, User Story 3 should be fully functional - workspace features validated and documented

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation, cleanup, and ensuring migration is production-ready

- [X] T075 [P] Remove npm baseline measurement code from .github/workflows/ci.yml and deploy.yml (timing added in T001-T002)
- [X] T076 [P] Delete baseline-npm-deps.json comparison file (created in T003)
- [X] T077 Verify .gitignore excludes pnpm store: check for `.pnpm-store` entry, add if missing
- [X] T078 Run full test suite one final time: `pnpm test` should pass 72/72 tests
- [X] T079 Run full build one final time: `pnpm run build` should succeed for all workspaces
- [X] T080 Run full linting one final time: `pnpm run lint` should have zero errors
- [X] T081 Verify package-lock.json is deleted and not in git: `git status` should not show package-lock.json
- [X] T082 Verify pnpm-lock.yaml is committed: `git status` should show pnpm-lock.yaml as committed
- [X] T083 Create comprehensive commit message documenting migration: include performance improvements, breaking changes (npm blocked), migration steps
- [X] T084 Commit all migration changes in single atomic commit
- [ ] T085 Create pull request for pnpm migration with performance comparison data from CI runs
- [ ] T086 Wait for CI to pass on PR: verify all quality checks pass with pnpm
- [ ] T087 Verify PR shows performance improvement in GitHub Actions job summary (installation time comparison)
- [ ] T088 Request review from team members, explain migration benefits and pnpm usage
- [ ] T089 Merge PR to main after approval
- [ ] T090 Monitor first post-merge deployment: verify Firebase Functions deploy successfully from isolated directory
- [ ] T091 Verify post-merge CI runs maintain <20s cached install times
- [ ] T092 Delete backup-npm-baseline branch (created in T005) after 1 week of stable pnpm operation
- [ ] T093 Update team on pnpm migration: send communication about new package manager, link to quickstart guide

**Checkpoint**: Migration complete and stable in production

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion (T001-T005)
- **User Story 1 (Phase 3)**: Depends on Foundational completion (T006-T031)
- **User Story 2 (Phase 4)**: Depends on Foundational (T006-T031), can run in parallel with US1 after foundational complete
- **User Story 3 (Phase 5)**: Depends on Foundational (T006-T031), can run in parallel with US1 and US2 after foundational complete
- **Polish (Phase 6)**: Depends on all user stories complete (US1, US2, US3)

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (T006-T031) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (T006-T031) - No dependencies on other stories
- **User Story 3 (P3)**: Can start after Foundational (T006-T031) - No dependencies on other stories

**All three user stories are independently testable and can be implemented in parallel after Foundational phase**

### Critical Path

```
Setup (T001-T005)
  → Foundational (T006-T031)
  → [US1 (T032-T049) | US2 (T050-T063) | US3 (T064-T074)] ← parallel execution
  → Polish (T075-T093)
```

**Estimated total time**:
- Setup: 1-2 hours (baseline measurement)
- Foundational: 3-4 hours (core migration)
- US1: 2-3 hours (CI/CD updates)
- US2: 2-3 hours (documentation updates)
- US3: 1-2 hours (workspace validation)
- Polish: 1-2 hours (final cleanup)

**Total: 10-16 hours** (with parallel execution of US1, US2, US3)

---

## Parallel Execution Examples

### After Foundational Phase Complete:

**Example 1: Three developers working in parallel**

- Developer A: US1 (T032-T049) - CI/CD workflow updates
- Developer B: US2 (T050-T063) - Documentation updates
- Developer C: US3 (T064-T074) - Workspace validation

All can work simultaneously since they touch different files and have no inter-dependencies.

**Example 2: Within Foundational Phase**

Many tasks marked [P] can run in parallel:

- T012, T013, T014 (adding engines.pnpm to workspaces) - different files
- T015, T016, T017 (updating workspace dependencies) - different files

**Example 3: Within Polish Phase**

- T075, T076, T077 (cleanup tasks) - different files, can run in parallel

---

## Implementation Strategy

### MVP Scope (Minimum Viable Product)

**Recommended MVP**: Complete through User Story 1 only

- ✅ Phase 1: Setup
- ✅ Phase 2: Foundational
- ✅ Phase 3: User Story 1 (CI/CD Pipeline Efficiency)
- ⏸️  Phase 4: User Story 2 (deferred)
- ⏸️  Phase 5: User Story 3 (deferred)
- ⏸️  Phase 6: Polish (minimal - just commit and merge)

**MVP delivers**:
- pnpm migration complete
- CI/CD performance improvement achieved (<20s cached, <45s changed)
- Firebase Functions deployment working
- Core functionality validated

**Post-MVP**: Add US2 (documentation) and US3 (workspace features) in subsequent PRs

### SLC Approach (Simple, Lovable, Complete)

1. **Simple**: Each user story is independently deliverable
2. **Lovable**: US1 delivers immediate CI/CD performance benefit
3. **Complete**: Each story fully functional on its own, thoroughly tested

### Incremental Delivery

1. **PR 1**: Setup + Foundational + US1 (core migration + CI/CD)
2. **PR 2**: US2 (documentation updates for developers)
3. **PR 3**: US3 (workspace features and validation)
4. **PR 4**: Polish (final cleanup)

OR deliver all in one atomic PR if preferred (recommended for infrastructure changes to avoid partial migration state).

---

## Task Format Validation

✅ All tasks follow format: `- [ ] [TaskID] [P?] [Story?] Description with file path`
✅ Task IDs sequential: T001-T093
✅ [P] markers for parallelizable tasks
✅ [US1], [US2], [US3] story labels in appropriate phases
✅ File paths included where applicable
✅ Setup/Foundational/Polish phases have NO story labels (correct)
✅ User Story phases have story labels (correct)

**Total task count**: 93 tasks
- Setup: 5 tasks
- Foundational: 26 tasks
- US1 (P1): 18 tasks
- US2 (P2): 14 tasks
- US3 (P3): 11 tasks
- Polish: 19 tasks

**Parallel opportunities**: 25 tasks marked [P] for concurrent execution
**Independent stories**: All 3 user stories can run in parallel after Foundational complete
