# Zaddies Game - Texas Hold'em Poker

A web-based Texas Hold'em Poker game for friend groups with Vegas-style rules, real-time multiplayer, and comprehensive chip tracking.

## Features

- 🎮 **Easy Table Access**: Join tables with simple 4-digit codes
- 🃏 **Vegas Rules**: Authentic Texas Hold'em gameplay
- 💰 **Cashier System**: Transparent chip debt tracking without real money
- 📺 **Shareable Views**: Stream-friendly URLs for Discord/OBS
- ♿ **Accessibility**: 100% color blind friendly design
- 🔐 **Security**: Server-authoritative game logic prevents cheating

## Tech Stack

- **Frontend**: Vite, React 18, TypeScript 5.3+, Chakra UI
- **Backend**: Firebase Functions, Node.js 20 LTS
- **Database**: Firebase Firestore (real-time NoSQL)
- **Testing**: Vitest, Testing Library
- **CI/CD**: GitHub Actions

## Prerequisites

- Node.js 20 LTS or higher
- pnpm 8.x or higher
- Firebase CLI: `pnpm install -g firebase-tools`
- Git

### Installing pnpm

\`\`\`bash

# macOS/Linux

npm install -g pnpm

# Or using Homebrew (macOS)

brew install pnpm

# Windows

npm install -g pnpm

# Verify installation

pnpm --version # Should output 8.x.x or higher
\`\`\`

## Quick Start

### 1. Clone and Install

\`\`\`bash
git clone https://github.com/circAssimilate/zaddies-game.git
cd zaddies-game
pnpm install
\`\`\`

### 2. Firebase Setup

\`\`\`bash

# Login to Firebase

firebase login

# Create/select project

firebase use --add

# Initialize Firebase

firebase init

# Select: Firestore, Functions, Hosting, Emulators

\`\`\`

### 3. Configure Environment

\`\`\`bash

# Frontend

cp frontend/.env.local.template frontend/.env.local

# Edit frontend/.env.local with your Firebase config

# Backend

cp backend/.env.template backend/.env

# Edit backend/.env if needed

\`\`\`

### 4. Start Development

\`\`\`bash

# Start Firebase emulators + frontend (parallel)

pnpm run dev

# Or start separately:

# Terminal 1: Firebase emulators

firebase emulators:start

# Terminal 2: Frontend

cd frontend && pnpm run dev
\`\`\`

Visit http://localhost:5173 for the app and http://localhost:4000 for Firebase Emulator UI.

## Development

### Running Tests

\`\`\`bash

# All tests (all workspaces)

pnpm test

# Test specific workspace

pnpm --filter frontend test
pnpm --filter backend test

# Watch mode

pnpm --filter frontend test:watch

# With coverage

pnpm --filter frontend test:coverage
\`\`\`

### Code Quality

\`\`\`bash

# Format code

pnpm run format

# Lint

pnpm run lint

# Fix linting issues

pnpm run lint:fix

# Run all checks (format + lint + test)

pnpm run check
\`\`\`

### Building

\`\`\`bash

# Build everything

pnpm run build

# Build frontend only

pnpm --filter frontend build

# Build backend only

pnpm --filter backend build
\`\`\`

### Pre-commit Hooks

**Automatic quality checks run before every commit:**

- ✨ Prettier formatting (auto-fixes)
- 🔍 ESLint linting (auto-fixes)
- 📝 TypeScript type checking (entire project)

**Hooks install automatically** when you run \`pnpm install\`.

**If a check fails**, your commit is blocked with clear error messages. Fix the errors and try again.

**Emergency bypass** (use sparingly):

\`\`\`bash
git commit --no-verify -m "emergency fix"
\`\`\`

**See also**: [docs/adr/005-precommit-hooks-and-ci-optimization.md](docs/adr/005-precommit-hooks-and-ci-optimization.md)

## Troubleshooting

### "Please use pnpm" Error

If you see this error when running npm commands:

\`\`\`
npm ERR! Unsupported engine: wanted: {"npm":"please-use-pnpm"}
\`\`\`

**Solution**: This project uses pnpm, not npm. Install pnpm globally and use it instead:

\`\`\`bash
npm install -g pnpm
pnpm install
\`\`\`

### Common pnpm Commands

\`\`\`bash

# Add dependency to specific workspace

pnpm --filter frontend add react-router-dom

# Add dev dependency

pnpm --filter frontend add -D @types/react-router-dom

# Remove dependency

pnpm --filter frontend remove react-router-dom

# Update dependencies

pnpm update # Update all
pnpm update react # Update specific package
\`\`\`

## Deployment

Deployment happens automatically via GitHub Actions when pushing to `main`.

### Manual Deployment

\`\`\`bash

# Deploy everything

firebase deploy

# Deploy hosting only

firebase deploy --only hosting

# Deploy functions only

firebase deploy --only functions
\`\`\`

## Project Structure

\`\`\`
zaddies-game/
├── frontend/ # React frontend
├── backend/ # Firebase Functions
├── shared/ # Shared TypeScript types
├── docs/ # Documentation and ADRs
├── specs/ # Feature specifications
└── .github/workflows/ # CI/CD pipelines
\`\`\`

## Documentation

- [Quickstart Guide](./specs/001-texas-holdem-poker/quickstart.md)
- [Feature Specification](./specs/001-texas-holdem-poker/spec.md)
- [Implementation Plan](./specs/001-texas-holdem-poker/plan.md)
- [Data Model](./specs/001-texas-holdem-poker/data-model.md)
- [Architecture Decision Records](./docs/adr/)

## Contributing

This is a private friend group project. See [constitution](./.specify/memory/constitution.md) for development principles.

## License

Private - Not for redistribution
