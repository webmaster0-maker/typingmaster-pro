/**
 * Safe storage utility with in-memory fallback for sandboxed iframes.
 * Prevents SecurityError or DOMException when third-party storage access is restricted.
 */
const memoryFallback: Record<string, string> = {};

export const safeStorage = {
  getItem: (key: string): string | null => {
    try {
      if (typeof window !== 'undefined' && 'localStorage' in window) {
        return window.localStorage.getItem(key);
      }
    } catch {
      // Silently fall back to in-memory storage for sandboxed iframe contexts
    }
    return memoryFallback[key] ?? null;
  },

  setItem: (key: string, value: string): void => {
    try {
      if (typeof window !== 'undefined' && 'localStorage' in window) {
        window.localStorage.setItem(key, value);
        return;
      }
    } catch {
      // Silently fall back to in-memory storage for sandboxed iframe contexts
    }
    memoryFallback[key] = value;
  },

  removeItem: (key: string): void => {
    try {
      if (typeof window !== 'undefined' && 'localStorage' in window) {
        window.localStorage.removeItem(key);
        return;
      }
    } catch {
      // Silently fall back to in-memory storage for sandboxed iframe contexts
    }
    delete memoryFallback[key];
  }
};
