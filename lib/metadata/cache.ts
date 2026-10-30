type CacheEntry = { value: unknown; expiresAt: number };

const globalCache = globalThis as typeof globalThis & {
  __octotvMetadataCache?: Map<string, CacheEntry>;
};

const store: Map<string, CacheEntry> =
  globalCache.__octotvMetadataCache ?? new Map<string, CacheEntry>();
globalCache.__octotvMetadataCache = store;

const MAX_ENTRIES = 500;

export type CachedOptions = {
  /** Time to live in milliseconds. */
  ttlMs?: number;
  /** Return last known value when the loader throws. */
  staleOnError?: boolean;
};

/**
 * Small in-process TTL cache for metadata provider responses.
 * On Cloudflare Workers each isolate keeps its own copy; responses are also
 * cached at the HTTP layer, so this is a cost guard rather than a source of truth.
 */
export async function cached<T>(
  key: string,
  loader: () => Promise<T>,
  options: CachedOptions = {},
): Promise<T> {
  const { ttlMs = 10 * 60 * 1000, staleOnError = false } = options;
  const now = Date.now();
  const existing = store.get(key);

  if (existing && existing.expiresAt > now) {
    return existing.value as T;
  }

  try {
    const value = await loader();
    if (store.size >= MAX_ENTRIES) {
      const oldest = store.keys().next().value;
      if (oldest) store.delete(oldest);
    }
    store.set(key, { value, expiresAt: now + ttlMs });
    return value;
  } catch (error) {
    if (staleOnError && existing) {
      store.set(key, { ...existing, expiresAt: now + Math.min(ttlMs, 60_000) });
      return existing.value as T;
    }
    throw error;
  }
}

export function invalidateCache(prefix?: string): void {
  if (!prefix) {
    store.clear();
    return;
  }
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key);
  }
}

export function cacheSize(): number {
  return store.size;
}
