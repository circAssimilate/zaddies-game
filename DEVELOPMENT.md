# Development Guide

## Quick Start

### Prerequisites

- Node.js 20 LTS or higher
- pnpm 8.x or higher
- **Java 11 or higher** (required for Firebase emulators)
  - Install: `brew install openjdk@11` (macOS)
  - Or download from: https://www.oracle.com/java/technologies/downloads/
- Firebase CLI (optional for backend development)
  - Install: `npm install -g firebase-tools`

### Installation

```bash
# Install dependencies
pnpm install
```

### Running the Application

#### Option 1: Frontend Only (Recommended for getting started)

```bash
# Start frontend dev server on http://localhost:5173
pnpm run dev:frontend
```

This runs the frontend without Firebase emulators. The backend functions won't work yet, but you can see the UI.

#### Option 2: Full Stack with Firebase Emulators

```bash
# Terminal 1: Start Firebase emulators
pnpm run dev:backend

# Terminal 2: Start frontend dev server
pnpm run dev:frontend
```

Or run both together:

```bash
pnpm run dev
```

The emulators will run on:
- Firestore: http://localhost:8080
- Functions: http://localhost:5001
- Auth: http://localhost:9099
- Hosting: http://localhost:5000
- Emulator UI: http://localhost:4000

### Development Scripts

```bash
# Run linting
pnpm run lint

# Fix linting errors
pnpm run lint:fix

# Format code
pnpm run format

# Check formatting
pnpm run format:check

# Run tests
pnpm test

# Run all checks (format, lint, test)
pnpm run check
```

### Running Tests

```bash
# Run all tests once
pnpm test

# Run tests in watch mode (frontend)
pnpm --filter frontend test:watch

# Run tests with coverage
pnpm --filter frontend test:coverage
```

### Building for Production

```bash
# Build all packages
pnpm run build

# Build frontend only
pnpm --filter frontend build

# Build backend only
pnpm --filter backend build
```

## Project Structure

```
zaddies-game/
├── frontend/          # React + Vite + Chakra UI
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Route pages
│   │   ├── hooks/        # React hooks
│   │   ├── services/     # Firebase services
│   │   └── theme/        # Chakra UI theme
│   └── tests/
├── backend/           # Firebase Functions + TypeScript
│   ├── src/
│   │   ├── functions/    # Cloud Functions
│   │   └── lib/          # Shared backend logic
│   └── tests/
├── shared/            # Shared types and constants
│   ├── types/
│   ├── constants/
│   └── lib/              # Shared poker logic
└── specs/             # Feature specifications
```

## Current Implementation Status

### ✅ Completed

- **Phase 1**: Project setup and infrastructure (28/28 tasks)
- **Phase 2**: Foundational components (23/27 tasks)
- **Phase 3**: User Story 1 - Create and Join Tables (20/20 tasks)
  - Backend Cloud Functions (createTable, joinTable, leaveTable)
  - Frontend pages and components
  - Real-time table synchronization
  - Error handling and loading states

### 🚧 Remaining

- **Phase 2**: Firebase Emulator setup (4 tasks)
- **Phase 4**: User Story 2 - Play Texas Hold'em Hands
- **Phase 5+**: Additional user stories

## Troubleshooting

### TypeScript Errors

If you see TypeScript compilation errors:

```bash
# Check errors
pnpm --filter frontend exec tsc --noEmit

# Or for backend
pnpm --filter backend exec tsc --noEmit
```

### Firebase Emulator Issues

**Error: "Unable to locate a Java Runtime"**

The Firebase emulators require Java to run. Install it:

```bash
# macOS (recommended)
brew install openjdk@11

# After install, add to PATH
echo 'export PATH="/opt/homebrew/opt/openjdk@11/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc

# Verify installation
java -version
```

**Other emulator issues:**

1. Ensure Firebase CLI is installed: `npm install -g firebase-tools`
2. Login to Firebase: `firebase login`
3. Check Java is in PATH: `java -version`

### Port Conflicts

If ports are already in use, you can modify them in `firebase.json`:

```json
{
  "emulators": {
    "firestore": { "port": 8080 },
    "functions": { "port": 5001 },
    "auth": { "port": 9099 }
  }
}
```

### Clean Install

If you have dependency issues:

```bash
# Remove all node_modules and lockfiles
rm -rf node_modules frontend/node_modules backend/node_modules shared/node_modules
rm pnpm-lock.yaml

# Reinstall
pnpm install
```

## Firebase Setup (For Full Development)

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable Firestore, Authentication (Anonymous), and Functions

### 2. Configure Local Environment

Create `frontend/.env.local`:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 3. Deploy Firebase Rules and Functions

```bash
# Deploy Firestore rules
firebase deploy --only firestore:rules

# Deploy Firestore indexes
firebase deploy --only firestore:indexes

# Deploy Cloud Functions
firebase deploy --only functions
```

## Testing Strategy

Following TDD approach:

1. **Unit Tests**: Test individual functions and components
2. **Integration Tests**: Test Cloud Functions with contracts
3. **E2E Tests**: Test complete user flows

Tests are located in:
- Frontend: `frontend/tests/`
- Backend: `backend/tests/`

## Code Quality

The project enforces:

- **TypeScript** strict mode
- **ESLint** for code quality
- **Prettier** for formatting
- **Vitest** for testing

Run all checks before committing:

```bash
pnpm run check
```

## Git Workflow

The project uses feature branches:

```bash
# Create feature branch
git checkout -b 001-feature-name

# Commit with conventional commits
git commit -m "feat: add new feature"
git commit -m "fix: resolve bug"
git commit -m "docs: update readme"

# Push to remote
git push origin 001-feature-name
```

## Need Help?

- Check the specs in `specs/001-texas-holdem-poker/`
- Review the project constitution in `.specify/constitution.md`
- See task breakdown in `specs/001-texas-holdem-poker/tasks.md`
