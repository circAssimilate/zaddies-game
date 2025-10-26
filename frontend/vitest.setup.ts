/**
 * Vitest setup file - runs before any tests
 * Mocks DOM APIs that are not available or work differently in jsdom
 */

// Store the original focus function
const originalFocus = HTMLElement.prototype.focus;

// Create a wrapper that @zag-js/focus-visible can override
let customFocus: ((this: HTMLElement) => void) | null = null;

// Define focus as a property that can be reassigned (for @zag-js/focus-visible)
Object.defineProperty(HTMLElement.prototype, 'focus', {
  get() {
    return (
      customFocus ||
      function (this: HTMLElement) {
        // Call original focus if it exists
        if (typeof originalFocus === 'function') {
          try {
            originalFocus.call(this);
          } catch {
            // Ignore errors in test environment
          }
        }
        // Set activeElement for testing-library
        Object.defineProperty(document, 'activeElement', {
          value: this,
          writable: true,
          configurable: true,
        });
      }
    );
  },
  set(newFocus: (this: HTMLElement) => void) {
    // Allow @zag-js to set its custom focus handler
    customFocus = newFocus;
  },
  configurable: true,
});

// Mock navigator.clipboard for copy functionality
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: async (_text: string) => {
      // Mock implementation
      return Promise.resolve();
    },
    readText: async () => {
      return Promise.resolve('');
    },
  },
  writable: true,
  configurable: true,
});
