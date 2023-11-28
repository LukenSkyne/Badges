
export const CACHE_DURATION = 1000 * 60 * 60 * 6 // 6 hours

export class CacheManager {

	private static cache: Map<string, CacheEntry> = new Map()

	static set(path: string, content: string) {
		this.cache.set(path, new CacheEntry(content))
	}

	static get(path: string) {
		const entry = CacheManager.cache.get(path)

		if (entry === undefined || !entry.isValid()) {
			return null
		}

		return JSON.parse(entry.content)
	}

	static purge() {
		for (const [path, entry] of CacheManager.cache.entries()) {
			if (!entry.isValid()) {
				CacheManager.cache.delete(path)
			}
		}
	}
}

export class CacheEntry {

	added: number
	content: string

	constructor(content: string) {
		this.added = Date.now()
		this.content = content
	}

	isValid() {
		return Date.now() - this.added < CACHE_DURATION
	}
}
