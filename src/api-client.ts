import { repository, version } from "../package.json"

const CACHE_DURATION = 6e4 // 1 hour

export class ApiClient {

	baseUrl: string
	headers: Headers
	rateLimitReset: number | null
	rateLimitRemaining: number | null
	cache: Map<string, CacheEntry>

	constructor(baseUrl: string) {
		this.baseUrl = baseUrl
		this.headers = new Headers({
			"Content-Type": "application/json",
			"Accept": "application/json",
			"User-Agent": `${repository?.split(":")[1]}/${version} (${process.env.CONTACT_EMAIL || "unknown fork"})`,
		})
		this.rateLimitReset = null
		this.rateLimitRemaining = null
		this.cache = new Map()
	}

	async get(path: string) {
		const cachedResult = this.getCached(path)

		if (cachedResult !== null) {
			return cachedResult
		}

		if (this.rateLimitRemaining !== null && this.rateLimitReset !== null &&
			this.rateLimitRemaining < 1 && Date.now() < this.rateLimitReset) {
			throw new Error("third-party rate-limit reached")
		}

		const response = await fetch(`${this.baseUrl}${path}`)
		this.rateLimitReset = Date.now() + Number(response.headers.get("X-Ratelimit-Reset")) * 1e3
		this.rateLimitRemaining = Number(response.headers.get("X-Ratelimit-Remaining"))

		if (response.status === 404) {
			return null
		}

		if (response.status !== 200) {
			throw new Error(`fetch failed: ${response.status} (${response.statusText})`)
		}

		const json = await response.json()
		this.cacheResponse(path, JSON.stringify(json))

		return json
	}

	private cacheResponse(path: string, json: string) {
		this.cache.set(path, { added: Date.now(), content: json })
	}

	private getCached(path: string) {
		const entry = this.cache.get(path)

		if (entry === undefined) return null // not cached yet

		if (Date.now() - entry.added < CACHE_DURATION) {
			return JSON.parse(entry.content)
		}

		this.cache.delete(path)

		return null
	}
}
