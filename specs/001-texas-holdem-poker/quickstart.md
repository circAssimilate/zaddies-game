# Quick Start: Texas Hold'em Poker Game

**Feature**: 001-texas-holdem-poker
**Date**: 2025-10-25
**Target Audience**: Developers

## Overview

This guide walks through setting up the development environment, running tests, and deploying the Texas Hold'em poker game to Firebase.

## Prerequisites

- **Node.js**: 20 LTS or higher
- **npm**: 10.x or higher
- **Git**: For version control
- **Firebase CLI**: `npm install -g firebase-tools`
- **Code Editor**: VS Code recommended (with Prettier and ESLint extensions)

## Initial Setup

### 1. Clone Repository

```bash
git clone <repository-url>
cd zaddies-game
```

### 2. Install Dependencies

```bash
# Install root dependencies (if using workspace)
npm install

# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
npm install
```

### 3. Firebase Project Setup

```bash
# Login to Firebase
firebase login

# Create new Firebase project (or use existing)
firebase projects:create zaddies-game

# Select project
firebase use zaddies-game

# Initialize Firebase in project
firebase init

# Select features:
# - Firestore
# - Functions
# - Hosting
# - Emulators (Firestore, Functions, Hosting, Auth)
```

**Firebase Configuration** (`firebase.json`):
```json
{
  "firestore": {
    "rules": "backend/firestore.rules",
    "indexes": "backend/firestore.indexes.json"
  },
  "functions": {
    "source": "backend",
    "runtime": "nodejs20",
    "predeploy": [
      "npm --prefix \"$RESOURCE_DIR\" run lint",
      "npm --prefix \"$RESOURCE_DIR\" run build"
    ]
  },
  "hosting": {
    "public": "frontend/dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  },
  "emulators": {
    "auth": {
      "port": 9099
    },
    "functions": {
      "port": 5001
    },
    "firestore": {
      "port": 8080
    },
    "hosting": {
      "port": 5000
    },
    "ui": {
      "enabled": true,
      "port": 4000
    }
  }
}
```

### 4. Environment Variables

Create `.env` files for local development:

**frontend/.env.local**:
```bash
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=zaddies-game.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=zaddies-game
VITE_FIREBASE_STORAGE_BUCKET=zaddies-game.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id

# Use emulators in development
VITE_USE_EMULATORS=true
```

**backend/.env**:
```bash
FIREBASE_CONFIG={"projectId":"zaddies-game","storageBucket":"zaddies-game.appspot.com"}
```

### 5. Configure Prettier and ESLint

**Root `.prettierrc`**:
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "arrowParens": "avoid"
}
```

**Root `.eslintrc.json`**:
```json
{
  "root": true,
  "env": {
    "browser": true,
    "es2021": true,
    "node": true
  },
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "prettier"
  ],
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "ecmaVersion": "latest",
    "sourceType": "module",
    "ecmaFeatures": {
      "jsx": true
    }
  },
  "plugins": ["@typescript-eslint", "react", "react-hooks"],
  "rules": {
    "react/react-in-jsx-scope": "off",
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }]
  },
  "settings": {
    "react": {
      "version": "detect"
    }
  }
}
```

**Install Dev Dependencies**:
```bash
# Root
npm install --save-dev prettier eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin eslint-plugin-react eslint-plugin-react-hooks eslint-config-prettier

# Add to package.json scripts
{
  "scripts": {
    "format": "prettier --write \"**/*.{ts,tsx,js,jsx,json,md}\"",
    "lint": "eslint \"**/*.{ts,tsx,js,jsx}\"",
    "lint:fix": "eslint \"**/*.{ts,tsx,js,jsx}\" --fix"
  }
}
```

## Development Workflow

### 1. Start Firebase Emulators

```bash
# From project root
firebase emulators:start
```

**Emulator UI**: http://localhost:4000

This starts:
- Firestore emulator (port 8080)
- Functions emulator (port 5001)
- Auth emulator (port 9099)
- Hosting emulator (port 5000)

### 2. Start Frontend Development Server

In a new terminal:

```bash
cd frontend
npm run dev
```

**Frontend URL**: http://localhost:5173 (Vite default)

**Hot Reload**: Vite provides instant HMR for fast development

### 3. Run Tests (TDD Workflow)

**Backend Tests**:
```bash
cd backend
npm test                 # Run all tests
npm test -- --watch      # Watch mode
npm test -- --coverage   # With coverage report
```

**Frontend Tests**:
```bash
cd frontend
npm test                 # Run all tests
npm test -- --watch      # Watch mode
npm test -- --coverage   # With coverage
```

**Run All Tests (Root)**:
```bash
npm test  # Runs both frontend and backend tests
```

### 4. Code Quality Checks

Before committing:

```bash
# Format code
npm run format

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Run all quality checks
npm run check  # format + lint + test
```

---

## TDD Workflow Example

### Writing a Test First

**Example**: Implement hand evaluator for Royal Flush

1. **Write Failing Test** (`backend/tests/unit/handEvaluator.test.ts`):

```typescript
import { describe, it, expect } from 'vitest';
import { evaluateHand } from '../../src/lib/poker/handEvaluator';

describe('Hand Evaluator', () => {
  it('should identify royal flush', () => {
    const cards = [
      { rank: 'A', suit: 'spades' },
      { rank: 'K', suit: 'spades' },
      { rank: 'Q', suit: 'spades' },
      { rank: 'J', suit: 'spades' },
      { rank: '10', suit: 'spades' },
    ];

    const result = evaluateHand(cards);

    expect(result.handRank).toBe('Royal Flush');
    expect(result.value).toBe(10); // Highest rank
  });
});
```

2. **Run Test (Should Fail)**:

```bash
cd backend
npm test handEvaluator.test.ts

# Output: FAIL - evaluateHand is not defined
```

3. **Implement Minimal Code**:

```typescript
// backend/src/lib/poker/handEvaluator.ts
export function evaluateHand(cards: Card[]): HandEvaluation {
  // Check for royal flush
  const isRoyalFlush = checkRoyalFlush(cards);
  if (isRoyalFlush) {
    return { handRank: 'Royal Flush', value: 10 };
  }

  // ... other hand rankings

  return { handRank: 'High Card', value: 0 };
}
```

4. **Run Test (Should Pass)**:

```bash
npm test handEvaluator.test.ts

# Output: PASS
```

5. **Refactor** (if needed, keeping tests green)

6. **Commit**:

```bash
git add .
git commit -m "feat: add royal flush detection to hand evaluator"
```

---

## Project Structure

```text
zaddies-game/
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Route pages
│   │   ├── services/      # Firebase SDK
│   │   ├── hooks/         # Custom hooks
│   │   ├── theme/         # Chakra UI theme
│   │   └── types/         # TypeScript types
│   ├── tests/             # Frontend tests
│   ├── vite.config.ts
│   └── package.json
├── backend/               # Firebase Functions
│   ├── src/
│   │   ├── functions/     # Cloud Functions
│   │   ├── lib/           # Game logic
│   │   └── types/         # Shared types
│   ├── tests/             # Backend tests
│   ├── firestore.rules    # Security rules
│   ├── firestore.indexes.json
│   └── package.json
├── shared/                # Shared types/constants
│   └── types/
├── docs/                  # Documentation
│   └── adr/               # Architecture Decision Records
├── .github/
│   └── workflows/
│       ├── ci.yml         # Continuous Integration
│       └── deploy.yml     # Deployment
├── firebase.json
├── .prettierrc
├── .eslintrc.json
├── .gitignore
├── package.json           # Root workspace
└── README.md
```

---

## Continuous Integration (GitHub Actions)

### CI Workflow (`.github/workflows/ci.yml`)

Runs on all pull requests:

```yaml
name: Continuous Integration

on:
  pull_request:
    branches: [ main ]
  push:
    branches: [ main ]

jobs:
  quality-checks:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: |
          npm ci
          cd frontend && npm ci
          cd ../backend && npm ci

      - name: Prettier Check
        run: npm run format -- --check

      - name: ESLint
        run: npm run lint

      - name: Run Backend Tests
        run: cd backend && npm test

      - name: Run Frontend Tests
        run: cd frontend && npm test

      - name: Build Frontend
        run: cd frontend && npm run build

      - name: Build Backend
        run: cd backend && npm run build
```

**Status Checks**:
- ✅ Prettier formatting
- ✅ ESLint linting
- ✅ Backend unit tests pass
- ✅ Frontend unit tests pass
- ✅ Frontend builds successfully
- ✅ Backend builds successfully

**Merge Blocking**: All checks must pass before merge to `main`.

---

## Deployment (GitHub Actions)

### Deploy Workflow (`.github/workflows/deploy.yml`)

Runs on merge/push to `main`:

```yaml
name: Deploy to Firebase

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    needs: quality-checks  # Only deploy if CI passes

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: |
          npm ci
          cd frontend && npm ci
          cd ../backend && npm ci

      - name: Build Frontend
        run: cd frontend && npm run build

      - name: Build Backend
        run: cd backend && npm run build

      - name: Deploy to Firebase
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          channelId: live
          projectId: zaddies-game

      - name: Deploy Functions
        run: firebase deploy --only functions
        env:
          FIREBASE_TOKEN: ${{ secrets.FIREBASE_TOKEN }}
```

### Setup GitHub Secrets

1. **Get Firebase Service Account**:
   ```bash
   firebase init hosting:github
   # Follow prompts to create service account
   ```

2. **Add Secrets to GitHub**:
   - Go to Repository Settings → Secrets and Variables → Actions
   - Add `FIREBASE_SERVICE_ACCOUNT` (JSON from Firebase)
   - Add `FIREBASE_TOKEN` (from `firebase login:ci`)

---

## Common Commands

### Development

```bash
# Start everything
npm run dev                 # Starts emulators + frontend + backend

# Individual services
firebase emulators:start    # Start Firebase emulators
cd frontend && npm run dev  # Start Vite dev server
cd backend && npm run watch # Watch and rebuild backend
```

### Testing

```bash
# Run all tests
npm test

# Backend only
cd backend && npm test

# Frontend only
cd frontend && npm test

# Watch mode
npm test -- --watch

# Coverage
npm test -- --coverage
```

### Quality Checks

```bash
# Format code
npm run format

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Run all checks (format + lint + test)
npm run check
```

### Building

```bash
# Build frontend
cd frontend && npm run build

# Build backend
cd backend && npm run build

# Build both
npm run build
```

### Deployment

```bash
# Deploy everything
firebase deploy

# Deploy hosting only
firebase deploy --only hosting

# Deploy functions only
firebase deploy --only functions

# Deploy Firestore rules
firebase deploy --only firestore:rules
```

---

## Firebase Emulator Tips

### 1. Seed Data

Create test data for development:

```bash
# backend/scripts/seedData.ts
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const app = initializeApp();
const db = getFirestore();

async function seedData() {
  // Create test players
  await db.collection('players').doc('player1').set({
    id: 'player1',
    username: 'Alice',
    email: 'alice@example.com',
    createdAt: new Date(),
    lastSeen: new Date(),
  });

  // Create test table
  await db.collection('tables').doc('1234').set({
    id: '1234',
    hostId: 'player1',
    status: 'waiting',
    // ... rest of table data
  });

  console.log('Seed data created');
}

seedData();
```

Run: `ts-node backend/scripts/seedData.ts`

### 2. Export/Import Emulator Data

```bash
# Export data
firebase emulators:export ./emulator-data

# Import data on start
firebase emulators:start --import=./emulator-data
```

### 3. Debug Functions Locally

```bash
# Add breakpoints in VS Code
# Start emulators with inspect flag
firebase emulators:start --inspect-functions
```

---

## Troubleshooting

### Emulator Port Conflicts

If ports are in use:

```bash
# Kill processes on specific port
lsof -ti:8080 | xargs kill -9

# Or change ports in firebase.json
```

### Firebase CLI Issues

```bash
# Update Firebase CLI
npm install -g firebase-tools@latest

# Clear Firebase cache
firebase logout
firebase login
```

### Build Errors

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear build caches
cd frontend && rm -rf dist .vite
cd backend && rm -rf lib
```

### Test Failures

```bash
# Update snapshots (if using snapshot testing)
npm test -- -u

# Run specific test file
npm test handEvaluator.test.ts

# Verbose output
npm test -- --reporter=verbose
```

---

## Performance Monitoring

### Firebase Performance Monitoring

Add to frontend:

```typescript
import { getPerformance } from 'firebase/performance';

const perf = getPerformance(app);
```

**Automatic Traces**:
- Page load time
- Network requests
- Custom traces for game actions

### Bundle Analysis

```bash
cd frontend
npm run build -- --mode=analyze
```

Opens visualization of bundle sizes. Target: < 500KB gzipped.

---

## Security Best Practices

### Firestore Security Rules Testing

```bash
# Test rules locally
firebase emulators:exec --only firestore \
  "cd backend && npm run test:rules"
```

**backend/tests/rules/firestore.test.ts**:
```typescript
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';

describe('Firestore Security Rules', () => {
  it('should allow player to read own data', async () => {
    const testEnv = await initializeTestEnvironment({ projectId: 'test' });
    const alice = testEnv.authenticatedContext('alice');

    await assertSucceeds(alice.firestore().collection('players').doc('alice').get());
  });

  it('should deny reading other player hole cards', async () => {
    const testEnv = await initializeTestEnvironment({ projectId: 'test' });
    const alice = testEnv.authenticatedContext('alice');

    await assertFails(
      alice.firestore()
        .collection('tables/1234/hands/1/playerHands').doc('bob').get()
    );
  });
});
```

---

## Summary

Development workflow:
1. **Start emulators**: `firebase emulators:start`
2. **Start frontend**: `cd frontend && npm run dev`
3. **Write tests first** (TDD)
4. **Implement features**
5. **Run quality checks**: `npm run check`
6. **Commit and push**
7. **CI runs** (format, lint, test, build)
8. **Merge to main**
9. **Auto-deploy** via GitHub Actions

**Key Tools**:
- Firebase Emulators (local development)
- Vitest (testing)
- Vite (fast builds)
- Prettier (formatting)
- ESLint (linting)
- GitHub Actions (CI/CD)

**Free Tier Optimization**:
- Monitor Firebase console daily
- Alert at 80% quota
- Optimize reads/writes
- Cleanup old data

**Next Steps**: See `../tasks.md` (after running `/speckit.tasks`) for implementation task breakdown.
