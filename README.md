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
- npm 10.x or higher
- Firebase CLI: `npm install -g firebase-tools`
- Git

## Quick Start

### 1. Clone and Install

\`\`\`bash
git clone https://github.com/circAssimilate/zaddies-game.git
cd zaddies-game
npm install
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

# Start Firebase emulators

firebase emulators:start

# In another terminal, start frontend

cd frontend && npm run dev
\`\`\`

Visit http://localhost:5173 for the app and http://localhost:4000 for Firebase Emulator UI.

## Development

### Running Tests

\`\`\`bash

# All tests

npm test

# Watch mode

npm test -- --watch

# With coverage

npm test -- --coverage
\`\`\`

### Code Quality

\`\`\`bash

# Format code

npm run format

# Lint

npm run lint

# Fix linting issues

npm run lint:fix

# Run all checks (format + lint + test)

npm run check
\`\`\`

### Building

\`\`\`bash

# Build everything

npm run build

# Build frontend only

cd frontend && npm run build

# Build backend only

cd backend && npm run build
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
