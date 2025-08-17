
interface CacheEntry<T> {
  data: T;
  expiry: number;
}

const cache = new Map<string, CacheEntry<any>>();
const DEFAULT_TTL = 15 * 60 * 1000; // 15 minutes

export const cacheService = {
  get<T>(key: string): T | null {
    const entry = cache.get(key);
    if (!entry) {
      return null;
    }

    const isExpired = Date.now() > entry.expiry;
    if (isExpired) {
      cache.delete(key);
      return null;
    }

    return entry.data as T;
  },

  set<T>(key: string, data: T, ttl: number = DEFAULT_TTL): void {
    const expiry = Date.now() + ttl;
    const entry: CacheEntry<T> = { data, expiry };
    cache.set(key, entry);
  },

  clear(): void {
    cache.clear();
  }
};
