export const TTL_MS = {
  FIRMS: 30 * 60 * 1000,
  EONET: 30 * 60 * 1000,
  AIR_QUALITY: 30 * 60 * 1000,
  FORECAST: 60 * 60 * 1000,
  FLOOD: 180 * 60 * 1000,
  POWER: 360 * 60 * 1000,
} as const;

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const memoryCache = new Map<string, CacheEntry<unknown>>();
const STORAGE_PREFIX = 'earthpulse_cache_v1:';

export function safeGetItem(key: string): string | null {
  try {
    return typeof window !== 'undefined' ? window.localStorage.getItem(key) : null;
  } catch {
    return null;
  }
}

export function safeSetItem(key: string, value: string): void {
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(key, value);
    }
  } catch {
    // Ignore storage quota or private browsing errors
  }
}

export function safeRemoveItem(key: string): void {
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(key);
    }
  } catch {
    // Ignore
  }
}

export function getCached<T>(
  key: string,
  ttlMs: number,
  allowExpired = false
): { data: T; timestamp: number; stale: boolean } | null {
  const now = Date.now();
  const mem = memoryCache.get(key) as CacheEntry<T> | undefined;
  if (mem) {
    const age = now - mem.timestamp;
    if (age <= ttlMs || allowExpired) {
      return {
        data: mem.data,
        timestamp: mem.timestamp,
        stale: age > 2 * ttlMs,
      };
    }
  }

  const raw = safeGetItem(`${STORAGE_PREFIX}${key}`);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as CacheEntry<T>;
    if (!parsed || typeof parsed.timestamp !== 'number') return null;
    memoryCache.set(key, parsed);
    const age = now - parsed.timestamp;
    if (age <= ttlMs || allowExpired) {
      return {
        data: parsed.data,
        timestamp: parsed.timestamp,
        stale: age > 2 * ttlMs,
      };
    }
  } catch {
    return null;
  }

  return null;
}

export function setCached<T>(key: string, data: T): number {
  const timestamp = Date.now();
  const entry: CacheEntry<T> = { data, timestamp };
  memoryCache.set(key, entry);
  safeSetItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(entry));
  return timestamp;
}
