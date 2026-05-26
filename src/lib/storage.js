/**
 * Drop-in replacement for the Claude artifact `window.storage` API.
 * Uses the browser's localStorage so data persists per-device.
 *
 * If you later add accounts (Supabase / Firebase), replace these methods
 * with calls to your backend and the rest of the app keeps working.
 */

function isAvailable() {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return false;
    const probe = '__forge_probe__';
    window.localStorage.setItem(probe, '1');
    window.localStorage.removeItem(probe);
    return true;
  } catch (_) {
    return false;
  }
}

const ok = isAvailable();
const memoryStore = new Map(); // fallback for private mode / disabled storage

function rawGet(key) {
  return ok ? window.localStorage.getItem(key) : (memoryStore.get(key) ?? null);
}
function rawSet(key, value) {
  if (ok) window.localStorage.setItem(key, value);
  else memoryStore.set(key, value);
}
function rawDelete(key) {
  if (ok) window.localStorage.removeItem(key);
  else memoryStore.delete(key);
}
function rawKeys() {
  if (ok) {
    const out = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k) out.push(k);
    }
    return out;
  }
  return Array.from(memoryStore.keys());
}

export const storage = {
  async get(key) {
    const value = rawGet(key);
    return value === null || value === undefined ? null : { key, value };
  },

  async set(key, value) {
    try {
      rawSet(key, value);
      return { key, value };
    } catch (e) {
      console.warn('storage.set failed:', e);
      return null;
    }
  },

  async delete(key) {
    rawDelete(key);
    return { key, deleted: true };
  },

  async list(prefix = '') {
    const keys = rawKeys().filter((k) => !prefix || k.startsWith(prefix));
    return { keys, prefix };
  },
};
