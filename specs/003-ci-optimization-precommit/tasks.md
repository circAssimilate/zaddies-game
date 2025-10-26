# Tasks: CI/CD Optimization and Pre-commit Quality Checks

**Input**: Design documents from `/specs/003-ci-optimization-precommit/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app monorepo**: `backend/src/`, `frontend/src/`, `shared/src/`
- **Scripts**: `scripts/` at repository root
- **Workflows**: `.github/workflows/`
- **Git hooks**: `.husky/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install dependencies and create ADR documentation

- [x] T001 Install Husky and lint-staged dependencies in root package.json
- [x] T002 [P] Create ADR 005 documenting git hook framework choice in docs/adr/005-precommit-hooks-and-ci-optimization.md
- [x] T003 [P] Create scripts directory at repository root if it doesn't exist

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core file categorization logic that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 Create TypeScript type definitions for file categorization in shared/src/types/file-categorization.ts
- [x] T005 [P] Implement FileCategory enum in shared/src/types/file-categorization.ts
- [x] T006 [P] Implement CheckStatus enum in shared/src/types/precommit-checks.ts
- [x] T007 Implement categorizeFiles function in scripts/categorize-files.ts
- [x] T008 Implement getDefaultPatterns function for file pattern configuration in scripts/categorize-files.ts
- [x] T009 Implement normalizeFilePaths utility function in scripts/categorize-files.ts
- [x] T010 Add unit tests for file categorization logic in scripts/**tests**/categorize-files.test.ts

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Developer Commits Code Without Breaking CI (Priority: P1) 🎯 MVP

**Goal**: Implement pre-commit hooks that run Prettier, ESLint, and TypeScript checks to catch issues locally before CI runs

**Independent Test**: Make a commit with intentional formatting, linting, or type errors and verify the commit is blocked with clear error messages

### Implementation for User Story 1

- [x] T011 [P] [US1] Add Husky prepare script to root package.json
- [x] T012 [P] [US1] Add lint-staged configuration to root package.json
- [x] T013 [P] [US1] Add type-check script to root package.json
- [x] T014 [US1] Initialize Husky hooks directory using pnpm exec husky install
- [x] T015 [US1] Create pre-commit hook script in .husky/pre-commit
- [x] T016 [US1] Configure lint-staged to run Prettier on TypeScript/JavaScript files
- [x] T017 [US1] Configure lint-staged to run ESLint on TypeScript/JavaScript files
- [x] T018 [US1] Ensure pre-commit hook calls TypeScript compiler after lint-staged
- [x] T019 [US1] Make pre-commit hook executable (chmod +x .husky/pre-commit)
- [x] T020 [US1] Test pre-commit hooks with intentional formatting errors
- [x] T021 [US1] Test pre-commit hooks with intentional linting errors
- [x] T022 [US1] Test pre-commit hooks with intentional TypeScript errors
- [x] T023 [US1] Test pre-commit hooks with passing code
- [x] T024 [US1] Verify hook auto-installation via prepare script (pnpm install)
- [x] T025 [US1] Document hook bypass procedure (--no-verify) in quickstart.md

**Checkpoint**: At this point, User Story 1 should be fully functional - commits with errors should be blocked locally

---

## Phase 4: User Story 2 - Documentation Changes Skip Deployment (Priority: P2)

**Goal**: Modify CI workflows to skip build and deployment steps when only documentation files change, reducing CI time to under 2 minutes

**Independent Test**: Commit only documentation changes and verify CI completes in under 2 minutes without running build or deployment steps

### Implementation for User Story 2

- [x] T026 [P] [US2] Implement determineWorkflowSteps function in scripts/categorize-files.ts
- [x] T027 [P] [US2] Create GitHub Actions workflow helper script in scripts/get-changed-files.sh
- [x] T028 [US2] Add file change detection step to .github/workflows/ci.yml
- [x] T029 [US2] Add conditional logic to ci.yml to skip tests for documentation-only changes
- [x] T030 [US2] Add conditional logic to ci.yml to skip backend build for documentation-only changes
- [x] T031 [US2] Add conditional logic to ci.yml to skip frontend build for documentation-only changes
- [x] T032 [US2] Add workflow decision logging step to ci.yml
- [x] T033 [US2] Add file change detection step to .github/workflows/deploy.yml
- [x] T034 [US2] Add conditional logic to deploy.yml to skip build for documentation-only changes
- [x] T035 [US2] Add conditional logic to deploy.yml to skip Firebase deployment for documentation-only changes
- [x] T036 [US2] Add workflow decision logging step to deploy.yml
- [x] T037 [US2] Test documentation-only PR to verify CI skips build and deployment
- [x] T038 [US2] Test mixed changes (code + docs) to verify full pipeline runs
- [x] T039 [US2] Test configuration file changes to verify full pipeline runs
- [x] T040 [US2] Measure and log CI duration for documentation-only changes (should be <2 minutes)

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently - docs-only changes skip deployment

---

## Phase 5: User Story 3 - Selective CI Based on Changed Files (Priority: P3)

**Goal**: Further optimize CI by selectively running frontend/backend tests and builds based on which code areas changed

**Independent Test**: Make frontend-only changes and verify CI skips backend tests; make test-only changes and verify CI skips deployment

### Implementation for User Story 3

- [x] T041 [P] [US3] Add frontend-specific file pattern detection to categorizeFiles logic
- [x] T042 [P] [US3] Add backend-specific file pattern detection to categorizeFiles logic
- [x] T043 [P] [US3] Add test-only file pattern detection to categorizeFiles logic
- [x] T044 [US3] Extend determineWorkflowSteps to handle frontend-only changes
- [x] T045 [US3] Extend determineWorkflowSteps to handle backend-only changes
- [x] T046 [US3] Extend determineWorkflowSteps to handle test-only changes
- [x] T047 [US3] Add conditional logic to ci.yml to skip backend tests for frontend-only changes
- [x] T048 [US3] Add conditional logic to ci.yml to skip frontend tests for backend-only changes
- [x] T049 [US3] Add conditional logic to ci.yml to skip deployment for test-only changes
- [x] T050 [US3] Update workflow decision logging to show granular skip reasons
- [x] T051 [US3] Test frontend-only PR to verify backend tests are skipped
- [x] T052 [US3] Test backend-only PR to verify frontend tests are skipped
- [x] T053 [US3] Test test-only PR to verify deployment is skipped
- [x] T054 [US3] Test shared code changes to verify full pipeline runs

**Checkpoint**: All user stories should now be independently functional - CI intelligently optimizes based on changed files

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories, documentation, and performance validation

- [x] T055 [P] Add performance benchmarking to pre-commit hooks (log execution time)
- [x] T056 [P] Add timeout handling for pre-commit checks (fail if >60 seconds)
- [x] T057 [P] Improve error message formatting in pre-commit hook output
- [x] T058 [P] Add CI metrics tracking (job duration, steps skipped) to workflow logs
- [x] T059 Update quickstart.md with troubleshooting guide for common hook issues
- [x] T060 [P] Update README.md with pre-commit hooks and CI optimization overview
- [x] T061 Validate all success criteria from spec.md are measurable
- [x] T062 Create example commits demonstrating each CI optimization scenario
- [x] T063 [P] Run full quickstart.md validation (setup, commit, CI verification)
- [x] T064 [P] Document CI resource usage baseline for comparison after deployment

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-5)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Independent of US1 but logically builds on it
- **User Story 3 (P3)**: Depends on User Story 2 completion - Extends file categorization logic from US2

### Within Each User Story

**User Story 1**:

1. Package.json configuration tasks (T011-T013) can run in parallel
2. Husky initialization (T014) must complete before hook creation (T015)
3. Hook configuration (T016-T019) sequential
4. Testing tasks (T020-T024) can run after implementation complete

**User Story 2**:

1. Script implementation (T026-T027) can run in parallel
2. CI workflow modifications (T028-T032) sequential within ci.yml
3. Deploy workflow modifications (T033-T036) can run in parallel with ci.yml changes
4. Testing tasks (T037-T040) sequential after workflow changes deployed

**User Story 3**:

1. Pattern detection tasks (T041-T043) can run in parallel
2. Workflow logic extension (T044-T046) can run in parallel
3. CI conditional logic (T047-T050) sequential
4. Testing tasks (T051-T054) can run in parallel after implementation

### Parallel Opportunities

- All Setup tasks (T001-T003) marked [P] can run in parallel
- All Foundational type definitions (T004-T006) marked [P] can run in parallel
- Within US1: Package.json configs (T011-T013) can run in parallel
- Within US2: Script implementation (T026-T027) and later workflow files can be modified in parallel
- Within US3: Pattern detection tasks (T041-T043) and decision logic (T044-T046) can run in parallel
- All Polish tasks marked [P] can run in parallel
- Different user stories can be worked on in parallel by different team members (after Foundational phase)

---

## Parallel Example: User Story 1

```bash
# Launch package.json configuration tasks together:
Task T011: "Add Husky prepare script to root package.json"
Task T012: "Add lint-staged configuration to root package.json"
Task T013: "Add type-check script to root package.json"

# After Husky initialized, configure lint-staged patterns together:
Task T016: "Configure lint-staged to run Prettier on TypeScript/JavaScript files"
Task T017: "Configure lint-staged to run ESLint on TypeScript/JavaScript files"
```

---

## Parallel Example: User Story 2

```bash
# Launch script implementation tasks together:
Task T026: "Implement determineWorkflowSteps function in scripts/categorize-files.ts"
Task T027: "Create GitHub Actions workflow helper script in scripts/get-changed-files.sh"

# After workflow modifications, run tests in parallel:
Task T037: "Test documentation-only PR to verify CI skips build and deployment"
Task T038: "Test mixed changes (code + docs) to verify full pipeline runs"
Task T039: "Test configuration file changes to verify full pipeline runs"
```

---

## Parallel Example: User Story 3

```bash
# Launch pattern detection tasks together:
Task T041: "Add frontend-specific file pattern detection to categorizeFiles logic"
Task T042: "Add backend-specific file pattern detection to categorizeFiles logic"
Task T043: "Add test-only file pattern detection to categorizeFiles logic"

# Launch decision logic extension tasks together:
Task T044: "Extend determineWorkflowSteps to handle frontend-only changes"
Task T045: "Extend determineWorkflowSteps to handle backend-only changes"
Task T046: "Extend determineWorkflowSteps to handle test-only changes"

# Run integration tests in parallel:
Task T051: "Test frontend-only PR to verify backend tests are skipped"
Task T052: "Test backend-only PR to verify frontend tests are skipped"
Task T053: "Test test-only PR to verify deployment is skipped"
Task T054: "Test shared code changes to verify full pipeline runs"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T003)
2. Complete Phase 2: Foundational (T004-T010) - CRITICAL - blocks all stories
3. Complete Phase 3: User Story 1 (T011-T025)
4. **STOP and VALIDATE**: Test User Story 1 independently
   - Make commit with formatting errors → should be blocked
   - Make commit with linting errors → should be blocked
   - Make commit with type errors → should be blocked
   - Make commit with clean code → should succeed
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational (T001-T010) → Foundation ready
2. Add User Story 1 (T011-T025) → Test independently → Deploy/Demo (MVP!)
   - **Value**: Developers catch errors locally, CI failures reduced
3. Add User Story 2 (T026-T040) → Test independently → Deploy/Demo
   - **Value**: Documentation changes skip deployment, CI time reduced
4. Add User Story 3 (T041-T054) → Test independently → Deploy/Demo
   - **Value**: Selective CI execution, further resource optimization
5. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together (T001-T010)
2. Once Foundational is done:
   - Developer A: User Story 1 (T011-T025)
   - Developer B: User Story 2 (T026-T040) - can start in parallel
   - Developer C: User Story 3 (T041-T054) - starts after US2 completes
3. Stories complete and integrate independently

---

## Success Metrics Tracking

After implementation, measure against success criteria from spec.md:

- **SC-001**: Track % of errors caught locally vs in CI (target: 90%)
- **SC-002**: Measure pre-commit check duration for typical commits (target: <60s)
- **SC-003**: Measure documentation-only CI run duration (target: <2 minutes)
- **SC-004**: Compare CI resource usage before/after (target: 30% reduction)
- **SC-005**: Track failed CI builds due to formatting/linting/types (target: 80% decrease)
- **SC-006**: User testing - time to identify commit block reason (target: <10 seconds)
- **SC-007**: Track first-attempt pass rate after 2 weeks (target: 95%)
- **SC-008**: Validate file categorization accuracy (target: 99%)

---

## Notes

- [P] tasks = different files, no dependencies within the same batch
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- User Story 3 depends on User Story 2's file categorization logic (extends it)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Focus on MVP (User Story 1) first for immediate developer experience improvement
- ADR 005 creation (T002) is critical for documenting architectural decisions
