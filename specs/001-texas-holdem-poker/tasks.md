# Tasks: Texas Hold'em Poker Game

**Input**: Design documents from `/specs/001-texas-holdem-poker/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: The project uses Test-Driven Development (TDD) as mandated by the constitution. Tests MUST be written before implementation.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app structure**: `frontend/src/` and `backend/src/`
- Frontend uses Vite + React + TypeScript + Chakra UI
- Backend uses Firebase Functions + TypeScript
- Tests in respective `tests/` directories

---

## Phase 1: Setup (Shared Infrastructure) ✅ COMPLETE

**Purpose**: Project initialization and basic structure

- [x] T001 Create root package.json with workspace configuration
- [x] T002 Create frontend/ directory structure per plan.md
- [x] T003 Create backend/ directory structure per plan.md
- [x] T004 Create shared/ directory for common types
- [x] T005 [P] Initialize Vite project in frontend/ with React + TypeScript
- [x] T006 [P] Initialize Firebase Functions project in backend/
- [x] T007 [P] Install frontend dependencies (React, Chakra UI, Emotion, Firebase SDK, Vitest)
- [x] T008 [P] Install backend dependencies (Firebase Admin, TypeScript, Vitest)
- [x] T009 [P] Configure TypeScript for frontend in frontend/tsconfig.json
- [x] T010 [P] Configure TypeScript for backend in backend/tsconfig.json
- [x] T011 [P] Configure Vitest for frontend in frontend/vite.config.ts
- [x] T012 [P] Configure Vitest for backend in backend/vitest.config.ts
- [x] T013 [P] Create .prettierrc with project formatting rules
- [x] T014 [P] Create .eslintrc.json with TypeScript + React rules
- [x] T015 [P] Install Prettier and ESLint dev dependencies
- [x] T016 Create firebase.json configuration per quickstart.md
- [x] T017 Create backend/firestore.rules security rules file
- [x] T018 Create backend/firestore.indexes.json for required indexes
- [x] T019 Create .github/workflows/ci.yml for CI checks (Prettier, ESLint, tests)
- [x] T020 Create .github/workflows/deploy.yml for Firebase deployment
- [x] T021 Create frontend/.env.local template for Firebase config
- [x] T022 Create backend/.env template
- [x] T023 Create .gitignore for node_modules, dist, .env files
- [x] T024 Create README.md with setup and deployment instructions per quickstart.md
- [x] T025 [P] Create docs/adr/ directory for Architecture Decision Records
- [x] T026 [P] Create ADR 001: Firebase choice (docs/adr/001-firebase-choice.md)
- [x] T027 [P] Create ADR 002: Gilbert-Shannon-Reeds shuffling (docs/adr/002-gilbert-shannon-reeds.md)
- [x] T028 [P] Create ADR 003: Color blind accessibility (docs/adr/003-color-blind-accessibility.md)

---

## Phase 2: Foundational (Blocking Prerequisites) ✅ COMPLETE

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T029 Create shared TypeScript types in shared/types/game.ts (Card, Hand, GamePhase)
- [x] T030 Create shared TypeScript types in shared/types/player.ts (Player, PlayerState)
- [x] T031 Create shared TypeScript types in shared/types/table.ts (Table, TableSettings, SidePot)
- [x] T032 Create shared constants in shared/constants/gameRules.ts (hand rankings, default settings)
- [x] T033 [P] Implement Gilbert-Shannon-Reeds shuffler in shared/lib/poker/shuffler.ts
- [x] T034 [P] Write tests for shuffler in backend/tests/unit/shuffler.test.ts (verify distribution)
- [x] T035 [P] Implement hand evaluator in shared/lib/poker/handEvaluator.ts
- [x] T036 [P] Write tests for hand evaluator in backend/tests/unit/handEvaluator.test.ts (all hand types)
- [x] T037 Implement pot calculator in shared/lib/poker/potCalculator.ts (main pot, side pots)
- [x] T038 Write tests for pot calculator in backend/tests/unit/potCalculator.test.ts
- [x] T039 Implement game engine core in backend/src/lib/poker/gameEngine.ts
- [x] T040 Write tests for game engine in backend/tests/unit/gameEngine.test.ts
- [x] T041 [P] Configure Firebase Authentication in frontend/src/services/firebase/config.ts
- [x] T042 [P] Create authentication service in frontend/src/services/firebase/auth.ts
- [x] T043 [P] Write tests for auth service in frontend/tests/unit/auth.test.ts
- [x] T044 [P] Create Firestore service wrapper in frontend/src/services/firebase/players.ts & tables.ts
- [x] T045 [P] Create real-time listener helpers in frontend/src/services/firebase/listeners.ts
- [x] T046 Create color blind friendly Chakra UI theme in frontend/src/theme/index.ts (colors)
- [x] T047 Create custom component styles in frontend/src/theme/index.ts (components)
- [x] T048 Create base Card component in frontend/src/components/Card/Card.tsx (with suit icons, patterns)
- [x] T049 Write tests for Card component in frontend/tests/components/Card.test.tsx
- [x] T050 Create Chip component in frontend/src/components/Chip/Chip.tsx
- [x] T051 Create Timer component in frontend/src/components/Timer/Timer.tsx
- [x] T052 [P] Implement Firestore security rules in backend/firestore.rules per contracts
- [x] T053 [P] Create composite indexes in backend/firestore.indexes.json
- [x] T054 Initialize Firebase Emulators for local development
- [x] T055 Create emulator seed data script in backend/scripts/seedData.ts

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Create and Join Tables (Priority: P1) 🎯 MVP

**Goal**: Players can create tables with 4-digit codes and join existing tables

**Independent Test**: Create a table, get 4-digit code, have second player join using code, verify both see table lobby

### Tests for User Story 1 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T056 [P] [US1] Write contract test for createTable function in backend/tests/integration/tableManagement.test.ts
- [x] T057 [P] [US1] Write contract test for joinTable function in backend/tests/integration/tableManagement.test.ts
- [x] T058 [P] [US1] Write integration test for table creation flow in frontend/tests/integration/createJoinFlow.test.tsx

**Note**: T056 and T057 are combined in `tableManagement.test.ts` (17/17 tests passing) for better test isolation. T058 includes 14 tests with 14/14 passing (100%) - tests cover create table flow, join table flow, and table lobby display. ChakraUI/jsdom compatibility resolved by downgrading @testing-library/user-event to 14.5.2.

### Implementation for User Story 1

- [x] T059 [P] [US1] Create Player Firestore collection schema in backend/src/functions/game/schemas.ts
- [x] T060 [P] [US1] Create Table Firestore collection schema in backend/src/functions/game/schemas.ts
- [x] T061 [US1] Implement createTable Cloud Function in backend/src/functions/game/createTable.ts
- [x] T062 [US1] Implement joinTable Cloud Function in backend/src/functions/game/joinTable.ts
- [x] T063 [US1] Implement leaveTable Cloud Function in backend/src/functions/game/leaveTable.ts
- [x] T064 [US1] Implement 4-digit code generator in backend/src/lib/utils/codeGenerator.ts
- [x] T065 [P] [US1] Create useAuth hook in frontend/src/hooks/useAuth.ts
- [x] T066 [P] [US1] Create useTable hook in frontend/src/hooks/useTable.ts (real-time table listener)
- [x] T067 [P] [US1] Create Home page component in frontend/src/pages/Home.tsx
- [x] T068 [P] [US1] Create TableLobby page component in frontend/src/pages/TableLobby.tsx
- [x] T069 [US1] Implement CreateTableModal component in frontend/src/components/Table/CreateTableModal.tsx
- [x] T070 [US1] Implement JoinTableForm component in frontend/src/components/Table/JoinTableForm.tsx
- [x] T071 [US1] Implement PlayerList component in frontend/src/components/Table/PlayerList.tsx
- [x] T072 [US1] Implement StartGameButton component in frontend/src/components/Table/StartGameButton.tsx (host only)
- [x] T073 [US1] Add routing configuration in frontend/src/App.tsx (Home, TableLobby, Game routes)
- [x] T074 [US1] Add error handling and validation in table creation/join flows
- [x] T075 [US1] Add loading states for async operations

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Play Texas Hold'em Hands (Priority: P1)

**Goal**: Players can play complete poker hands with Vegas rules

**Independent Test**: Two players at table, play through complete hand from blinds through showdown, verify pot awarded correctly

### Tests for User Story 2 ⚠️

- [ ] T076 [P] [US2] Write contract test for playerAction function in backend/tests/integration/playerAction.test.ts
- [ ] T077 [P] [US2] Write contract test for startGame function in backend/tests/integration/startGame.test.ts
- [ ] T078 [P] [US2] Write integration test for complete hand flow in backend/tests/integration/handFlow.test.ts

### Implementation for User Story 2

- [ ] T079 [P] [US2] Create Hand schema in backend/src/functions/game/schemas.ts
- [ ] T080 [P] [US2] Create PlayerHand subcollection schema in backend/src/functions/game/schemas.ts
- [ ] T081 [US2] Implement startGame Cloud Function in backend/src/functions/game/startGame.ts
- [ ] T082 [US2] Implement playerAction Cloud Function in backend/src/functions/game/playerAction.ts
- [ ] T083 [US2] Implement hand initialization logic in backend/src/lib/poker/handManager.ts
- [ ] T084 [US2] Implement betting round logic in backend/src/lib/poker/bettingRound.ts
- [ ] T085 [US2] Implement showdown logic in backend/src/lib/poker/showdownHandler.ts
- [ ] T086 [US2] Implement pot distribution logic using potCalculator
- [ ] T087 [US2] Implement blind posting logic in backend/src/lib/poker/blindManager.ts
- [ ] T088 [US2] Implement dealer button rotation in backend/src/lib/poker/dealerManager.ts
- [ ] T089 [US2] Implement player dealing-in rules (wait for big blind)
- [ ] T090 [US2] Implement all-in and side pot handling
- [ ] T091 [P] [US2] Create useGameState hook in frontend/src/hooks/useGameState.ts
- [ ] T092 [P] [US2] Create usePlayerHand hook in frontend/src/hooks/usePlayerHand.ts (private hole cards)
- [ ] T093 [P] [US2] Create Game page component in frontend/src/pages/Game.tsx
- [ ] T094 [P] [US2] Create TableView component in frontend/src/components/Table/TableView.tsx
- [ ] T095 [US2] Create CommunityCards component in frontend/src/components/Table/CommunityCards.tsx
- [ ] T096 [US2] Create PotDisplay component in frontend/src/components/Table/PotDisplay.tsx
- [ ] T097 [US2] Create PlayerSeat component in frontend/src/components/Table/PlayerSeat.tsx
- [ ] T098 [US2] Create HoleCards component in frontend/src/components/Hand/HoleCards.tsx
- [ ] T099 [US2] Create ActionButtons component in frontend/src/components/Hand/ActionButtons.tsx (Fold, Call, Raise)
- [ ] T100 [US2] Create BetSlider component in frontend/src/components/Hand/BetSlider.tsx
- [ ] T101 [US2] Implement turn indicator UI (highlight current player)
- [ ] T102 [US2] Implement action timer countdown display
- [ ] T103 [US2] Implement auto-fold on timeout (backend trigger function)
- [ ] T104 [US2] Add sound effects for actions (optional, accessibility)
- [ ] T105 [US2] Add animations for card dealing and pot distribution

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Cashier and Chip Management (Priority: P2)

**Goal**: Players can buy chips, cash out, and view transparent ledger

**Independent Test**: Player buys chips, plays hands, cashes out, verify ledger accurate

### Tests for User Story 3 ⚠️

- [ ] T106 [P] [US3] Write contract test for buyChips function in backend/tests/integration/buyChips.test.ts
- [ ] T107 [P] [US3] Write contract test for cashOut function in backend/tests/integration/cashOut.test.ts
- [ ] T108 [P] [US3] Write integration test for ledger calculations in backend/tests/integration/ledger.test.ts

### Implementation for User Story 3

- [ ] T109 [P] [US3] Create Ledger subcollection schema in backend/src/functions/cashier/schemas.ts
- [ ] T110 [US3] Implement buyChips Cloud Function in backend/src/functions/cashier/buyChips.ts
- [ ] T111 [US3] Implement cashOut Cloud Function in backend/src/functions/cashier/cashOut.ts
- [ ] T112 [US3] Implement getLedger Cloud Function in backend/src/functions/cashier/getLedger.ts
- [ ] T113 [US3] Implement ledger transaction creation in backend/src/lib/ledger/transactionManager.ts
- [ ] T114 [US3] Implement running balance calculation
- [ ] T115 [US3] Implement max debt limit validation
- [ ] T116 [P] [US3] Create useLedger hook in frontend/src/hooks/useLedger.ts
- [ ] T117 [P] [US3] Create Cashier page component in frontend/src/pages/Cashier.tsx
- [ ] T118 [P] [US3] Create BuyChipsModal component in frontend/src/components/Cashier/BuyChipsModal.tsx
- [ ] T119 [P] [US3] Create CashOutModal component in frontend/src/components/Cashier/CashOutModal.tsx
- [ ] T120 [US3] Create LedgerTable component in frontend/src/components/Cashier/LedgerTable.tsx
- [ ] T121 [US3] Create PlayerBalanceSummary component in frontend/src/components/Cashier/PlayerBalanceSummary.tsx
- [ ] T122 [US3] Create TransactionHistory component in frontend/src/components/Cashier/TransactionHistory.tsx
- [ ] T123 [US3] Implement buy chips at table functionality (update table chips + ledger)
- [ ] T124 [US3] Add chip balance display in player profile
- [ ] T125 [US3] Add validation for max debt limit before chip purchase
- [ ] T126 [US3] Add transparent ledger view (all players see all balances)

**Checkpoint**: All user stories 1-3 should now be independently functional

---

## Phase 6: User Story 4 - Table Configuration and Admin Controls (Priority: P2)

**Goal**: Hosts can configure table settings (blinds, timers, buy-in limits)

**Independent Test**: Create table, configure custom settings, start game, verify settings enforced

### Tests for User Story 4 ⚠️

- [ ] T127 [P] [US4] Write contract test for updateTableSettings function in backend/tests/integration/updateSettings.test.ts
- [ ] T128 [P] [US4] Write integration test for settings enforcement in backend/tests/integration/settingsValidation.test.ts

### Implementation for User Story 4

- [ ] T129 [US4] Implement updateTableSettings Cloud Function in backend/src/functions/game/updateTableSettings.ts
- [ ] T130 [US4] Implement settings validation logic in backend/src/lib/validation/settingsValidator.ts
- [ ] T131 [US4] Implement blind increase timer in backend/src/lib/poker/blindTimer.ts
- [ ] T132 [US4] Implement max stack size enforcement in chip buying logic
- [ ] T133 [US4] Implement host transfer on leave in leaveTable function
- [ ] T134 [P] [US4] Create TableSettingsModal component in frontend/src/components/Table/TableSettingsModal.tsx
- [ ] T135 [P] [US4] Create SettingsForm component in frontend/src/components/Table/SettingsForm.tsx
- [ ] T136 [US4] Add settings UI controls (sliders, inputs) for all configurable settings
- [ ] T137 [US4] Add validation feedback for settings ranges
- [ ] T138 [US4] Add blind increase notification UI
- [ ] T139 [US4] Add host transfer notification when host leaves

**Checkpoint**: Table configuration should work independently

---

## Phase 7: User Story 5 - Shareable Views for Streaming (Priority: P3)

**Goal**: Generate shareable URLs for table and personal hand views

**Independent Test**: Generate shareable view, open in separate window, verify real-time updates

### Tests for User Story 5 ⚠️

- [ ] T140 [P] [US5] Write contract test for generateShareableView function in backend/tests/integration/shareableView.test.ts
- [ ] T141 [P] [US5] Write integration test for real-time view updates in frontend/tests/integration/shareableViewSync.test.tsx

### Implementation for User Story 5

- [ ] T142 [P] [US5] Create ShareableView collection schema in backend/src/functions/utility/schemas.ts
- [ ] T143 [US5] Implement generateShareableView Cloud Function in backend/src/functions/utility/generateShareableView.ts
- [ ] T144 [US5] Implement view expiration logic (24 hour TTL)
- [ ] T145 [P] [US5] Create ShareableTableView page in frontend/src/pages/ShareableTableView.tsx
- [ ] T146 [P] [US5] Create ShareableHandView page in frontend/src/pages/ShareableHandView.tsx
- [ ] T147 [US5] Create CompactHandView component in frontend/src/components/ShareableView/CompactHandView.tsx
- [ ] T148 [US5] Create TableOnlyView component in frontend/src/components/ShareableView/TableOnlyView.tsx
- [ ] T149 [US5] Implement real-time sync for shareable views (Firestore listeners)
- [ ] T150 [US5] Add toggle for hand strength display in personal view
- [ ] T151 [US5] Add copy URL button for sharing
- [ ] T152 [US5] Add embed code generation for Discord/OBS

**Checkpoint**: Shareable views should work independently

---

## Phase 8: User Story 6 - Hand History and Card Reveal Rules (Priority: P3)

**Goal**: Record hand history and implement show/muck card rules

**Independent Test**: Play hands with various outcomes, verify history recorded correctly per Vegas rules

### Tests for User Story 6 ⚠️

- [ ] T153 [P] [US6] Write contract test for getHandHistory function in backend/tests/integration/handHistory.test.ts
- [ ] T154 [P] [US6] Write integration test for show/muck rules in backend/tests/integration/showdownRules.test.ts

### Implementation for User Story 6

- [ ] T155 [P] [US6] Create HandHistory subcollection schema in backend/src/functions/game/schemas.ts
- [ ] T156 [US6] Implement getHandHistory Cloud Function in backend/src/functions/utility/getHandHistory.ts
- [ ] T157 [US6] Implement hand history recording in showdown handler
- [ ] T158 [US6] Implement show/muck logic in backend/src/lib/poker/showdownRules.ts
- [ ] T159 [US6] Implement all-in player must-show rule
- [ ] T160 [P] [US6] Create HandHistoryPanel component in frontend/src/components/History/HandHistoryPanel.tsx
- [ ] T161 [P] [US6] Create HandHistoryEntry component in frontend/src/components/History/HandHistoryEntry.tsx
- [ ] T162 [US6] Create ShowMuckButtons component in frontend/src/components/Hand/ShowMuckButtons.tsx
- [ ] T163 [US6] Add hand history sidebar toggle
- [ ] T164 [US6] Add hand replay functionality (optional)
- [ ] T165 [US6] Implement history cleanup (keep last 50 hands per table)

**Checkpoint**: All user stories should now be independently functional

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T166 [P] Implement Firebase emulator setup script per quickstart.md
- [ ] T167 [P] Create emulator seed data with test players and tables
- [ ] T168 [P] Add comprehensive logging to all Cloud Functions
- [ ] T169 [P] Add Firebase Performance Monitoring to frontend
- [ ] T170 [P] Implement error boundaries in React app (frontend/src/components/ErrorBoundary.tsx)
- [ ] T171 [P] Add offline detection and reconnection UI
- [ ] T172 [P] Optimize Firestore reads (implement caching where appropriate)
- [ ] T173 [P] Implement rate limiting in Cloud Functions
- [ ] T174 [P] Add Firebase Analytics tracking for player actions
- [ ] T175 [P] Create cleanup function for old ended tables (backend/src/functions/scheduled/cleanupTables.ts)
- [ ] T176 [P] Optimize bundle size (code splitting, lazy loading)
- [ ] T177 [P] Add PWA support for mobile (manifest.json, service worker)
- [ ] T178 [P] Implement accessibility audit fixes (ARIA labels, keyboard navigation)
- [ ] T179 [P] Add color blind mode testing with Chrome DevTools simulation
- [ ] T180 [P] Create user documentation in docs/user-guide.md
- [ ] T181 [P] Add GitHub Actions status badges to README.md
- [ ] T182 [P] Run security audit (npm audit, Firestore rules review)
- [ ] T183 [P] Performance testing (Lighthouse, Web Vitals)
- [ ] T184 [P] Load testing with Firebase Emulator
- [ ] T185 Run quickstart.md validation (full setup from scratch)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-8)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Phase 9)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 3 (P2)**: Can start after Foundational (Phase 2) - May integrate with US1/US2 but independently testable
- **User Story 4 (P2)**: Can start after Foundational (Phase 2) - Builds on US1 (table creation) but independently testable
- **User Story 5 (P3)**: Can start after Foundational (Phase 2) - Uses table/hand state from US1/US2 but independently testable
- **User Story 6 (P3)**: Can start after Foundational (Phase 2) - Uses hand completion from US2 but independently testable

### Within Each User Story

- Tests (if included) MUST be written and FAIL before implementation
- Schemas/types before functions
- Backend functions before frontend components
- Hooks before components that use them
- Core implementation before UI polish
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, all user stories can start in parallel (if team capacity allows)
- All tests for a user story marked [P] can run in parallel
- Models/schemas within a story marked [P] can run in parallel
- Different user stories can be worked on in parallel by different team members

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together:
Task T056: "Write contract test for createTable function"
Task T057: "Write contract test for joinTable function"
Task T058: "Write integration test for table creation flow"

# Launch all schemas for User Story 1 together:
Task T059: "Create Player Firestore collection schema"
Task T060: "Create Table Firestore collection schema"

# Launch all frontend components for User Story 1 together (after hooks):
Task T067: "Create Home page component"
Task T068: "Create TableLobby page component"
Task T069: "Implement CreateTableModal component"
Task T070: "Implement JoinTableForm component"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (Create/Join Tables)
4. Complete Phase 4: User Story 2 (Play Hands)
5. **STOP and VALIDATE**: Test both stories work together
6. Deploy MVP for friend group testing

**MVP Delivers**: Functional poker game for 2-10 players with Vegas rules, manual chip tracking

### Incremental Delivery

1. MVP (US1 + US2) → Deploy → Test with friends
2. Add User Story 3 (Cashier) → Deploy → Test ledger tracking
3. Add User Story 4 (Settings) → Deploy → Test customization
4. Add User Story 5 (Shareable Views) → Deploy → Test streaming
5. Add User Story 6 (Hand History) → Deploy → Test transparency
6. Polish (Phase 9) → Final Deploy

Each increment adds value without breaking previous stories.

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (Create/Join)
   - Developer B: User Story 2 (Play Hands)
   - Developer C: User Story 3 (Cashier)
3. Stories complete and integrate independently
4. Team tackles User Stories 4-6 in priority order
5. Final team effort on Polish phase

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- **TDD**: Verify tests fail before implementing (Red-Green-Refactor)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence

---

## Total Task Count

- **Setup**: 28 tasks
- **Foundational**: 27 tasks
- **User Story 1**: 20 tasks
- **User Story 2**: 30 tasks
- **User Story 3**: 21 tasks
- **User Story 4**: 13 tasks
- **User Story 5**: 13 tasks
- **User Story 6**: 13 tasks
- **Polish**: 20 tasks

**Total**: 185 tasks

**Parallel Opportunities**: 78 tasks marked [P] can run in parallel
**MVP Scope**: Setup + Foundational + US1 + US2 = 105 tasks (~57% of total)

---

## Validation Checklist

✅ All tasks follow format: `- [ ] [ID] [P?] [Story?] Description with file path`
✅ Each user story is independently testable
✅ TDD approach with tests before implementation
✅ Clear file paths for all implementation tasks
✅ Dependencies documented (Foundational blocks all stories)
✅ Parallel opportunities identified (78 tasks)
✅ MVP scope defined (User Stories 1 + 2)
✅ All tasks map to requirements from spec.md
✅ Constitution principles reflected (TDD, modularity, performance, separation, observability)
