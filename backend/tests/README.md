# Backend Integration Tests

## Prerequisites

The integration tests require Firebase emulators to be running.

### 1. Install Firebase Tools (if not already installed)

```bash
pnpm install -g firebase-tools
```

### 2. Start Firebase Emulators

From the **project root directory**, start the emulators:

```bash
firebase emulators:start
```

This will start:

- Firestore emulator on port 8080
- Auth emulator on port 9099
- Functions emulator on port 5001
- Emulator UI on port 4000

### 3. Run Tests

In a **separate terminal**, from the backend directory:

```bash
# Run all tests
pnpm test

# Run specific test file
pnpm test tests/integration/createTable.test.ts

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage
```

## Test Structure

- `tests/helpers/emulator.ts` - Helper functions for connecting to Firebase emulators
- `tests/integration/` - Integration tests that test Cloud Functions with actual Firestore
- `tests/unit/` - Unit tests for isolated logic

## Notes

- Integration tests will automatically connect to the emulators using the ports configured in `firebase.json`
- Tests clear Firestore data before each test to ensure isolation
- The emulators must be running before tests are executed
