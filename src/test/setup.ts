// Minimal in-memory localStorage so persistence tests run under the node
// environment without jsdom.
const store = new Map<string, string>();

type Fn = (key: string) => string | null;

(globalThis as { localStorage?: unknown }).localStorage = {
  getItem: ((key: string) => store.get(key) ?? null) as Fn,
  setItem: (key: string, value: string) => void store.set(key, String(value)),
  removeItem: (key: string) => void store.delete(key),
  clear: () => store.clear(),
  key: () => null,
  get length() {
    return store.size;
  },
};
