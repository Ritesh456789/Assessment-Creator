type CacheEntry<T> = {
	value: T;
	expiresAt: number;
};

class MemoryCacheService {
	private cache = new Map<string, CacheEntry<unknown>>();

	get<T>(key: string): T | null {
		const entry = this.cache.get(key);
		if (!entry) {
			return null;
		}

		if (entry.expiresAt < Date.now()) {
			this.cache.delete(key);
			return null;
		}

		return entry.value as T;
	}

	set<T>(key: string, value: T, ttlMs = 60_000) {
		this.cache.set(key, {
			value,
			expiresAt: Date.now() + ttlMs,
		});
	}

	delete(key: string) {
		this.cache.delete(key);
	}
}

export const cacheService = new MemoryCacheService();