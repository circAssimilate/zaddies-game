# Quick Start Guide

## Get Started in 2 Minutes

### Option 1: Frontend Only (No Java Required) ⚡

Perfect for UI development and testing components:

```bash
# 1. Install dependencies
pnpm install

# 2. Start frontend dev server
pnpm -w run dev:frontend
```

Open **http://localhost:5173** - You'll see the poker app UI!

**What works:**

- ✅ All UI components render
- ✅ Routing and navigation
- ✅ Form validation
- ✅ Component interactions

**What doesn't work (yet):**

- ❌ Creating tables (needs backend)
- ❌ Joining tables (needs backend)
- ❌ Real-time updates (needs backend)

### Option 2: Full Stack (Requires Java) 🔥

For full functionality including backend Firebase functions:

**Prerequisites:**

```bash
# Install Java (required for Firebase emulators)
brew install openjdk@11

# Add to PATH
echo 'export PATH="/opt/homebrew/opt/openjdk@11/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc

# Verify
java -version
```

**Run both frontend and backend:**

```bash
# Install dependencies
pnpm install

# Start everything (requires Java)
pnpm run dev
```

**OR run separately:**

```bash
# Terminal 1: Backend (Firebase emulators)
pnpm -w run dev:backend

# Terminal 2: Frontend
pnpm -w run dev:frontend
```

Open **http://localhost:5173** for the app, **http://localhost:4000** for Firebase Emulator UI

## Common Errors

### Error: Java Not Found

If you see:

```
Error: Process `java -version` has exited with code 1
Unable to locate a Java Runtime
```

**Solution:** Install Java using the commands in Option 2 above.

### Error: Library not loaded (ICU4C)

If you see:

```
dyld: Library not loaded: /opt/homebrew/opt/icu4c/lib/libicui18n.73.dylib
```

**This means Node is linked to an old ICU4C version.** Fix it:

```bash
# If using nvm (recommended):
nvm install 20 --latest-npm
nvm use 20
nvm alias default 20

# Verify
node --version  # Should show v20.19.5 or newer

# If using Homebrew node:
brew reinstall node
```

**Why this happens:** Homebrew updated ICU4C but your Node installation wasn't recompiled.

## Alternative: Skip Backend for Now

You can develop the frontend without Firebase emulators:

1. Run `pnpm -w run dev:frontend`
2. UI works perfectly
3. Add Firebase emulators later when needed

## Next Steps

- **See UI development**: Check `DEVELOPMENT.md`
- **Learn project structure**: Read `specs/001-texas-holdem-poker/`
- **Run tests**: `pnpm test`

## Need Help?

**Firebase emulator won't start?**

- Ensure Java is installed: `java -version`
- Check Firebase CLI: `firebase --version`
- See detailed troubleshooting in `DEVELOPMENT.md`

**Frontend won't start?**

- Check Node version: `node --version` (need 20+)
- Check pnpm: `pnpm --version` (need 8+)
- Reinstall: `rm -rf node_modules && pnpm install`

**TypeScript errors?**

- Check compilation: `pnpm --filter frontend exec tsc --noEmit`
- All errors should be fixed in latest commit

---

**TL;DR**: Run `pnpm -w run dev:frontend` to get started immediately without Java! 🚀
