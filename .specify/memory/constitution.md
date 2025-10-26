<!--
SYNC IMPACT REPORT
==================
Version: 1.3.0 → 1.4.0
Change Type: MINOR (New principle added)
Date: 2025-10-26

Modified Principles:
- NEW: IX. Living Documentation

Added Sections:
- Living Documentation principle covering GAMEPLAY.md, README.md, and QUICKSTART.md
- Information hierarchy to prevent documentation bifurcation
- Single source of truth requirement: README.md comprehensive, QUICKSTART.md references only
- Enforcement requirements for keeping all three documentation files synchronized

Removed Sections:
- (None)

Templates Requiring Updates:
✅ .specify/templates/plan-template.md - Constitution Check section will include documentation requirement
✅ .specify/templates/spec-template.md - Requirements alignment verified
✅ .specify/templates/tasks-template.md - Task categorization includes documentation updates
✅ Command files - No command files found in .specify/templates/commands/

Follow-up TODOs:
- ✅ Updated Quality Gates section to include Living Documentation check
- ✅ Updated Code Review Requirements to reference 9 principles
- ✅ Added Documentation Updates item to Code Review checklist
- ✅ Added Documentation Duplication check to Code Review checklist
- ✅ Updated Runtime Development Guidance to reference all documentation files

Rationale for MINOR version bump:
Adding a new principle (IX. Living Documentation) to ensure documentation stays synchronized
with implementation. This covers GAMEPLAY.md (game rules), README.md (development reference),
and QUICKSTART.md (fast-path guide) while preventing documentation bifurcation through a
single source of truth hierarchy. This codifies documentation maintenance as a first-class
deliverable without removing existing principles.
-->

# Zaddies Game Constitution

## Core Principles

### I. Test-Driven Development (NON-NEGOTIABLE)

Test-Driven Development (TDD) is mandatory for all feature development. Tests MUST be written before implementation code, approved by stakeholders, and must fail initially before implementation begins. The Red-Green-Refactor cycle is strictly enforced:

1. **Red**: Write failing tests that define desired behavior
2. **Green**: Implement minimal code to pass tests
3. **Refactor**: Improve code quality while maintaining passing tests

**Rationale**: TDD ensures requirements are understood before coding, reduces debugging time, provides living documentation, and enables confident refactoring. For a game project, this prevents regressions in game mechanics, physics, and player interactions.

**Enforcement**:

- All PRs MUST include tests written before implementation
- Tests MUST fail initially (demonstrated in PR description or commit history)
- Code reviews MUST verify TDD compliance
- No exceptions without explicit architectural review and justification

### II. Modular Architecture

All game features and systems MUST be developed as independently testable, loosely coupled modules. Each module MUST have:

- Clear, single responsibility (e.g., physics, rendering, input, game state)
- Well-defined interfaces and contracts
- Independence from other modules (minimal coupling)
- Comprehensive documentation of purpose and API
- Self-contained test suite

**Rationale**: Modular architecture enables parallel development, simplifies testing, allows component reuse, and makes the system maintainable as complexity grows. Games inherently have many independent systems (physics, AI, rendering, audio) that benefit from isolation.

**Prohibited**: Creating "organizational-only" modules that exist solely for code grouping without functional purpose. Avoid tight coupling between game systems that prevents independent testing.

### III. Performance-First

All features MUST meet defined performance benchmarks before merge. Performance is not optional or "nice to have" - it is a core requirement that MUST be validated during development.

**Required Benchmarks** (adjust per game requirements):

- **Frame Rate**: Maintain target FPS (e.g., 60 FPS minimum on target hardware)
- **Latency**: Client-server round-trip < 100ms (p95)
- **Load Time**: Initial game load < 3 seconds
- **Memory**: Stay within memory budget (define per platform)
- **Battery**: Mobile builds MUST be power-efficient (define drain limits)

**Enforcement**:

- Performance tests MUST be included in test suites
- Benchmarks MUST pass in CI/CD pipeline
- Performance regressions block merges
- Profiling data MUST be included for performance-critical features

**Rationale**: Games are performance-sensitive applications where poor performance directly impacts player experience. Addressing performance issues late is costly; building performance awareness from the start prevents technical debt.

### IV. Client-Server Separation

The Zaddies Game architecture MUST maintain clear separation between frontend (client) and backend (server) concerns:

**Frontend Responsibilities**:

- Rendering and visual presentation
- User input handling and local UI state
- Client-side prediction and interpolation
- Asset loading and caching
- Animation and visual effects

**Backend Responsibilities**:

- Authoritative game state and physics
- Player data persistence and validation
- Game logic enforcement (prevent cheating)
- Multiplayer synchronization
- Analytics and telemetry collection

**Contracts**:

- All client-server communication MUST use well-defined API contracts
- API contracts MUST be versioned and documented
- Breaking changes MUST follow semantic versioning rules
- Contract changes require integration tests

**Rationale**: Clear separation prevents client-side manipulation, enables independent scaling, allows frontend/backend teams to work in parallel, and supports multiple client platforms (web, mobile) from a single backend.

### V. Observability & Debuggability

All game systems MUST be observable and debuggable in development and production environments.

**Requirements**:

- **Structured Logging**: All critical game events MUST be logged with structured data (JSON format preferred)
- **Metrics Collection**: Performance metrics, player actions, and system health MUST be instrumented in a way that doesn't cost
- **Error Reporting**: All errors MUST include context (game state, player ID, timestamp, stack trace)
- **Debug Interfaces**: Development builds MUST include debug UI for inspecting game state
- **Cost Conscious**: Keep hosting and service costs in mind - trying to keep the cost footprint as small as possible

**Prohibited**:

- Using tools or platforms that require a subscription
- Silent failures or swallowed errors
- Logging sensitive player data (PII) without consent
- Production builds with debug logging enabled (performance impact)

**Rationale**: Games are complex stateful systems where issues are hard to reproduce. Comprehensive observability enables rapid debugging, understanding player behavior, and data-driven design decisions.

### VI. Mobile-First UI Design

All frontend user interfaces MUST be designed and implemented with a mobile-first approach. Desktop and larger screen experiences are progressive enhancements built on top of a fully functional mobile foundation.

**Mobile-First Requirements**:

- **Design Mobile First**: UI components MUST be designed for mobile screens (320px-428px width) before desktop
- **Touch-Optimized**: All interactive elements MUST have minimum 44x44px touch targets
- **Responsive by Default**: Layouts MUST use fluid grids, flexible images, and CSS media queries
- **Performance on Mobile**: Initial page load MUST be under 3 seconds on 3G networks
- **Progressive Enhancement**: Advanced features for larger screens MUST NOT break mobile experience
- **Mobile Testing Required**: All PRs MUST include mobile viewport testing (iOS Safari, Android Chrome minimum)

**Prohibited**:

- Desktop-first designs that are retrofitted to mobile
- Fixed-width layouts that require horizontal scrolling on mobile
- Interactive elements smaller than 44x44px touch targets
- Features that only work on desktop without mobile fallback
- Assuming mouse/keyboard input (must support touch, keyboard, and assistive technologies)

**Rationale**: Mobile devices represent the majority of web traffic and the primary access point for many users. Mobile-first design ensures accessibility, performance, and usability across all devices. Starting with mobile constraints forces focus on core functionality and prevents bloat. Games and interactive applications must be enjoyable on mobile to reach the widest audience.

**Enforcement**:

- Design mockups MUST show mobile views first (320px, 375px, 428px widths)
- CSS MUST use min-width media queries (mobile-first breakpoints)
- Performance budgets MUST prioritize mobile network conditions
- Accessibility testing MUST include mobile screen readers
- All user stories MUST define mobile acceptance criteria

### VII. Universal Accessibility

All user interfaces MUST be accessible to users of all abilities, including those with visual, motor, cognitive, and auditory disabilities. Accessibility is a core requirement, not an optional enhancement.

**Accessibility Requirements**:

- **WCAG AA Compliance**: All UI components MUST meet WCAG 2.1 Level AA standards
- **Color-Blind Safe**: Visual information MUST NOT rely solely on color (use patterns, shapes, labels)
- **Contrast Ratios**: Text and interactive elements MUST meet 4.5:1 minimum contrast ratio
- **Keyboard Navigation**: All functionality MUST be fully operable via keyboard
- **Screen Reader Support**: All interactive elements MUST have proper ARIA labels and semantic HTML
- **Focus Indicators**: Keyboard focus MUST be clearly visible (distinct outline/highlight)

**Color-Blind Specific Requirements** (per ADR 003):

- **Blue/Orange Palette**: Use blue (#2563EB, #1E40AF) and orange (#F97316, #EA580C) instead of red/green
- **Pattern Redundancy**: Combine color with patterns/textures for differentiation
- **Suit Differentiation**: Spades (solid blue), Clubs (blue + dots), Hearts (solid orange), Diamonds (orange + stripes)
- **Testing Required**: Validate with Chrome DevTools color vision simulations (protanopia, deuteranopia, tritanopia)

**Prohibited**:

- Red/green color combinations without alternative cues
- Color-only differentiation (must include patterns, shapes, or labels)
- Interactive elements below 4.5:1 contrast ratio
- Mouse-only interactions without keyboard alternatives
- Images or icons without alt text or ARIA labels
- Automatic carousels or animations without pause controls

**Rationale**: Approximately 8% of males and 0.5% of females have color vision deficiency. WCAG compliance is both a legal requirement in many jurisdictions and an ethical imperative. Universal design principles benefit all users, not just those with disabilities. Games should be enjoyable by everyone regardless of ability.

**Enforcement**:

- Design mockups MUST demonstrate color-blind safe palettes
- All PRs MUST include accessibility testing (axe DevTools, WAVE, or similar)
- Color vision simulations MUST pass for all critical UI elements
- Keyboard navigation MUST be tested for all user flows
- Screen reader testing required for key interactions
- Contrast ratios verified with WebAIM or similar tools

### VIII. Architecture Decision Records (ADRs)

All architecturally significant decisions MUST be documented in Architecture Decision Records (ADRs). An ADR captures a single architectural decision, its context, rationale, and consequences to maintain institutional knowledge and prevent future teams from inadvertently reversing decisions without understanding their original justification.

**When to Create ADRs**:

- **Structural Changes**: Modifications affecting system structure, components, or modules
- **Non-Functional Requirements**: Decisions impacting performance, security, scalability, or reliability
- **Technology Choices**: Selection of frameworks, libraries, databases, or infrastructure
- **Interface Contracts**: Changes to APIs, protocols, or integration patterns
- **Construction Techniques**: Build processes, deployment strategies, or development workflows
- **Dependency Management**: Addition or removal of significant external dependencies

**Required ADR Structure** (per Michael Nygard format):

1. **Title**: Short noun phrase (e.g., "ADR 003: Use Blue/Orange Color Palette for Accessibility")
2. **Status**: One of "proposed", "accepted", "deprecated", "superseded by [ADR-NNN]"
3. **Context**: Forces at play (technological, political, social, project constraints) in neutral language
4. **Decision**: Team's response in active voice ("We will...")
5. **Consequences**: All effects (positive, negative, neutral) resulting from this decision

**ADR Management**:

- Store in version control at `docs/adr/NNN-decision-title.md`
- Use Markdown format (lightweight, readable)
- Number sequentially starting from 001 (never reuse numbers)
- Keep documents to 1-2 pages maximum
- Write in complete sentences and conversational style
- Reference related ADRs when superseding or building upon previous decisions

**Prohibited**:

- Making significant architectural decisions without documenting rationale
- Deleting or renaming existing ADRs (mark as deprecated/superseded instead)
- Writing ADRs after implementation is complete (document during decision-making)
- Vague or evaluative language in Context section (remain factual and neutral)
- Missing consequences section (document all trade-offs, even if negative)

**Rationale**: Architecture erodes over time as original decision-makers leave and context is forgotten. ADRs create a decision log that explains "why" not just "what", preventing future developers from needing to reverse-engineer project rationale. This practice is essential for long-lived projects and teams with changing membership. The lightweight format (1-2 pages in Markdown) keeps documentation sustainable while preserving critical institutional knowledge.

**Enforcement**:

- PRs with architectural impact MUST include or update relevant ADRs
- ADRs MUST be reviewed alongside code changes
- Constitution amendments MUST reference ADR process in governance section
- Feature specifications SHOULD reference existing ADRs when applicable
- Quarterly ADR review to mark deprecated decisions and identify missing documentation

### IX. Living Documentation

All documentation MUST be kept synchronized with implementation. Documentation is a first-class deliverable - when code changes affect setup, gameplay, or workflows, documentation updates are NOT optional but mandatory parts of feature delivery.

**Documentation Scope**:

1. **GAMEPLAY.md** - Player-facing game rules, mechanics, and behavior (single source of truth for gameplay)
2. **README.md** - Comprehensive development reference: setup, tooling, troubleshooting, project overview (single source of truth for development)
3. **QUICKSTART.md** - Streamlined fast-path for experienced developers (references README.md, does NOT duplicate)

**Information Hierarchy** (to prevent documentation bifurcation):

- **README.md**: Comprehensive reference with full explanations, troubleshooting, and context
- **QUICKSTART.md**: Minimal steps with links to README.md sections for details
- **GAMEPLAY.md**: Complete game rules reference (independent from development docs)
- **Principle**: Each piece of information exists in ONE place only. Other docs reference, not duplicate.

**Documentation Requirements**:

- **GAMEPLAY.md Updates**: MUST be updated when any of the following change:
  - Game rules or mechanics (betting rules, hand rankings, showdown procedures)
  - Player experience or interactions (table joining, chip management, disconnection handling)
  - Edge cases or special rules (tie-breaking, split pots, dealing-in rules)
  - Algorithms affecting gameplay (shuffling, hand evaluation, pot calculation)

- **README.md Updates**: MUST be updated when any of the following change:
  - Prerequisites or dependencies (Node.js version, pnpm, Java, Firebase CLI)
  - Installation or setup steps (clone, install, Firebase init)
  - Environment configuration (`.env` files, config values)
  - Development commands (dev, build, test, lint)
  - Deployment procedures or CI/CD workflows
  - Project structure or monorepo organization
  - Troubleshooting steps or common errors
  - Tech stack or major architectural changes

- **QUICKSTART.md Updates**: MUST be updated when any of the following change:
  - Fast-path development workflows (fastest way to get started)
  - Common task shortcuts or automation scripts
  - Essential commands for daily development
  - Links to README.md sections (when README.md structure changes)

- **Synchronization**: Documentation updates MUST be included in the same PR as code changes
- **Accuracy**: Documentation MUST accurately reflect current implementation (no aspirational or outdated content)
- **Code References**: Include file paths and line numbers for key implementation logic
- **External Resources**: Link to papers, standards, or resources explaining algorithms or tools

**Required Documentation Sections**:

**GAMEPLAY.md**:

1. Game Overview - What makes this game unique, core features
2. Game Rules - Standard rules as implemented
3. Hand Rankings - All possible hands with examples
4. Comparison Logic - How hands are evaluated and compared
5. Tie Breaking - Rules for resolving identical hands
6. Shuffling & Randomness - Algorithm explanation and security model
7. Game Flow - Phases, betting rounds, action sequences
8. Betting Rules - Blinds, bet sizing, all-in mechanics
9. Special Rules - Edge cases, disconnections, admin controls

**README.md**:

1. Project Overview - What the project does, key features
2. Tech Stack - Technologies and versions used
3. Prerequisites - Required software and versions
4. Quick Start - Clone, install, configure, run
5. Development - Commands for testing, linting, building
6. Deployment - How to deploy to production
7. Project Structure - Directory organization
8. Troubleshooting - Common issues and solutions
9. Documentation Links - Links to other docs (GAMEPLAY.md, QUICKSTART.md, specs, ADRs)

**QUICKSTART.md**:

1. Minimal Setup - Fastest path to running the project (links to README.md for full details)
2. Common Commands - Essential daily development commands (links to README.md for full options)
3. Workflow Shortcuts - Automation scripts and helpers (links to README.md for troubleshooting)

**Prohibited**:

- Implementing changes without updating affected documentation
- Documenting features that don't exist or work differently than described
- Leaving outdated examples, commands, or explanations after code changes
- Creating separate documentation that conflicts with canonical docs
- **Duplicating information between README.md and QUICKSTART.md** (use references/links instead)
- Using technical jargon without explaining it for the target audience
- Deleting troubleshooting steps that are still relevant

**Rationale**: Documentation drift is one of the most common sources of frustration for new developers and confusion for players. Games have complex rules that aren't obvious from code, and development projects have setup steps that evolve over time. Out-of-sync documentation creates support burden, onboarding friction, and wasted time debugging documentation bugs. Documentation bifurcation (same information in multiple places) amplifies these problems - when information changes, all copies must be updated or they diverge. Enforcing a single source of truth for each piece of information (README.md for comprehensive details, QUICKSTART.md for fast-path references, GAMEPLAY.md for game rules) prevents this duplication trap. Treating documentation as a first-class deliverable (not an afterthought) ensures it remains useful, accurate, and trustworthy.

**Enforcement**:

- PRs changing game logic MUST include GAMEPLAY.md updates
- PRs changing setup/tooling/workflows MUST include README.md and/or QUICKSTART.md updates
- Code reviews MUST verify documentation accuracy and completeness
- Documentation reviews MUST validate against current implementation
- New features MUST add appropriate documentation sections
- Quarterly documentation audit to identify drift and gaps

## Development Workflow

### Code Review Requirements

All code changes MUST be reviewed and approved before merge:

1. **Tests First**: Reviewer verifies tests were written before implementation
2. **Constitution Compliance**: Verify adherence to all nine core principles
3. **Performance Validation**: Confirm performance benchmarks pass
4. **Documentation**: Ensure module interfaces and contracts are documented
5. **Security**: Check for client-side exploits, data validation issues
6. **ADR Updates**: Verify architectural decisions are documented in ADRs
7. **Documentation Updates**: Verify affected documentation (GAMEPLAY.md, README.md, QUICKSTART.md) is updated and synchronized
8. **No Documentation Duplication**: Verify information exists in ONE place only (no bifurcation between README.md and QUICKSTART.md)

### Branch Strategy

- **Main Branch**: Production-ready code only, protected, requires PR + reviews
- **Feature Branches**: Named `###-feature-name` matching spec directory
- **Release Branches**: For coordinated releases and hotfix isolation

### Testing Gates

Before merge, all PRs MUST pass:

1. **Unit Tests**: All module-level tests pass
2. **Integration Tests**: Client-server contract tests pass
3. **Performance Tests**: Benchmarks meet or exceed targets
4. **Contract Tests**: API compatibility verified
5. **Linting/Formatting**: Code style checks pass

## Quality Gates

### Constitution Check (Required for All Features)

Before implementation begins, features MUST be evaluated against these checks:

1. **TDD Compliance**: Are tests defined and will they be written first?
2. **Modularity**: Can this feature be implemented as independent module(s)?
3. **Performance Impact**: Are performance benchmarks defined and testable?
4. **Architecture Alignment**: Does this respect client-server separation?
5. **Observability**: Are logging, metrics, and debugging hooks planned?
6. **Mobile-First Design**: Are mobile views designed first with touch optimization?
7. **Universal Accessibility**: Are WCAG AA and color-blind requirements met?
8. **ADR Documentation**: Are architectural decisions documented with context and rationale?
9. **Living Documentation**: Will affected docs (GAMEPLAY.md, README.md, QUICKSTART.md) be updated? Is information in ONE place only?

**Complexity Justification**: Any violation of core principles MUST be documented with:

- What principle is being violated and why
- What simpler alternative was considered and why it was rejected
- What technical debt is being created and mitigation plan

### Performance Gate

All features MUST provide performance validation:

- Profiling data showing performance characteristics
- Benchmark test results on target hardware
- Memory usage analysis
- Network bandwidth impact (for multiplayer features)

## Governance

### Amendment Process

This constitution supersedes all other development practices. Amendments require:

1. **Proposal**: Written proposal with rationale and impact analysis
2. **Review**: Technical leadership review and approval
3. **Version Update**: Semantic version bump (MAJOR/MINOR/PATCH)
4. **Migration Plan**: For breaking changes, document migration path
5. **Template Updates**: Update all dependent templates and documentation

### Versioning Policy

Constitution versions follow semantic versioning:

- **MAJOR**: Backward-incompatible changes (principle removal/redefinition)
- **MINOR**: New principles or materially expanded guidance
- **PATCH**: Clarifications, wording improvements, non-semantic fixes

### Compliance Review

- All pull requests MUST verify constitution compliance
- Complexity and principle violations MUST be justified in PR description
- Quarterly review of constitution effectiveness and potential improvements

### Runtime Development Guidance

For day-to-day development guidance and examples, consult:

- Implementation plans in `/specs/[###-feature]/plan.md`
- Feature specifications in `/specs/[###-feature]/spec.md`
- Task breakdowns in `/specs/[###-feature]/tasks.md`
- Game rules and mechanics in `/GAMEPLAY.md`
- Development setup and reference in `/README.md`
- Quick start guide in `/QUICKSTART.md`

**Version**: 1.4.0 | **Ratified**: 2025-10-25 | **Last Amended**: 2025-10-26
