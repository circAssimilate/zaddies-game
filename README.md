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

- Node.js 20 LTS or higher (managed via nvm recommended)
- pnpm 8.x or higher
- Java 21 or higher (required for Firebase emulators)
- Firebase CLI: `pnpm install -g firebase-tools`
- Git

### Installing Node.js via nvm (Recommended)

Using nvm ensures you have the correct Node.js version and avoids compatibility issues:

```bash
# Install nvm (if not already installed)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Install Node.js 20 LTS
nvm install 20

# Use Node.js 20
nvm use 20

# Set as default
nvm alias default 20
```

This project includes a `.nvmrc` file, so you can simply run `nvm use` in the project directory.

### Installing Java

Firebase emulators require Java 21 or higher:

```bash
# macOS (using Homebrew)
brew install openjdk@21

# Add to your shell configuration (~/.zshrc or ~/.bashrc)
export PATH="/opt/homebrew/opt/openjdk@21/bin:$PATH"
export JAVA_HOME="/opt/homebrew/opt/openjdk@21"

# Reload your shell
source ~/.zshrc  # or source ~/.bashrc

# Verify installation
java -version  # Should show version 21.x.x
```

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

# Frontend - Copy template to create local environment file

cp frontend/.env.local.template frontend/.env.local

# The template contains all Firebase config values - just copy it!

# VITE_USE_EMULATORS=true ensures you use local emulators for development

# Backend

cp backend/.env.template backend/.env

# Edit backend/.env if needed

\`\`\`

### 4. Start Development

\`\`\`bash

# Ensure you're using the correct Node.js version

nvm use

# Start Firebase emulators + frontend (parallel)

pnpm run dev

# Or start separately:

# Terminal 1: Firebase emulators

firebase emulators:start

# Terminal 2: Frontend

cd frontend && pnpm run dev
\`\`\`

Visit http://localhost:5173 for the app and http://localhost:4000 for Firebase Emulator UI.

**Note**: The first time you run `pnpm run dev`, the emulators may take a moment to start. If the frontend starts before the emulators are ready, you may see connection errors in the browser console. Just wait a few seconds and refresh the page.

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

### Firebase Emulator Errors

#### "Unable to locate a Java Runtime"

**Solution**: Install Java 21 or higher (see Prerequisites section above).

#### "firebase-tools will drop support for Java version < 21"

**Solution**: You have an older Java version installed. Update to Java 21:

\`\`\`bash

# macOS

brew install openjdk@21

# Update your ~/.zshrc or ~/.bashrc to use Java 21

# Remove or comment out any old Java paths (e.g., openjdk@11)

export PATH="/opt/homebrew/opt/openjdk@21/bin:$PATH"
export JAVA_HOME="/opt/homebrew/opt/openjdk@21"

# Reload shell and verify

source ~/.zshrc
java -version # Should show 21.x.x
\`\`\`

#### "Port 5000 is not open" or "Port taken"

**Solution**: The hosting emulator port is already in use. This has been resolved in the firebase.json config by removing the hosting emulator (we use Vite directly).

### ICU4C Library Errors (macOS)

If you see errors like `dyld: Library not loaded: libicui18n.73.dylib`:

**Solution**: Use nvm to install a fresh Node.js version:

\`\`\`bash
nvm install 20 --latest-npm
nvm use 20
nvm alias default 20
\`\`\`

### Blank Page or Auth Errors

If you see `auth/invalid-api-key` or a blank page:

**Solution**: Make sure you have a `.env.local` file in the `frontend/` directory with your Firebase credentials:

\`\`\`bash
cp frontend/.env.local.example frontend/.env.local

# Edit .env.local with your Firebase config values

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

- [Gameplay & Rules](./GAMEPLAY.md) - Texas Hold'em rules, hand rankings, and game mechanics
- [Quickstart Guide](./specs/001-texas-holdem-poker/quickstart.md)
- [Feature Specification](./specs/001-texas-holdem-poker/spec.md)
- [Implementation Plan](./specs/001-texas-holdem-poker/plan.md)
- [Data Model](./specs/001-texas-holdem-poker/data-model.md)
- [Architecture Decision Records](./docs/adr/)

## Contributing

This is a private friend group project. See [constitution](./.specify/memory/constitution.md) for development principles.

## License

Private - Not for redistribution
