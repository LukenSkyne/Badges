import { repository, version } from "../package.json"
import { CacheManager } from "./cache-manager"

export class ApiClient {

	static Modrinth = new ApiClient("https://api.modrinth.com/v2")
	static CurseForge = new ApiClient("https://api.cfwidget.com")

	baseUrl: string
	headers: Headers
	rateLimitReset: number | null
	rateLimitRemaining: number | null

	constructor(baseUrl: string) {
		this.baseUrl = baseUrl
		this.headers = new Headers({
			"Content-Type": "application/json",
			"Accept": "application/json",
			"User-Agent": `${repository?.split(":")[1]}/${version} (${process.env.CONTACT_EMAIL || "unknown fork"})`,
		})
		this.rateLimitReset = null
		this.rateLimitRemaining = null
	}

	async get(path: string) {
		const cachedResult = CacheManager.get(this.baseUrl + path)

		if (cachedResult !== null) {
			return cachedResult
		}

		if (this.rateLimitRemaining !== null && this.rateLimitReset !== null &&
			this.rateLimitRemaining < 1 && Date.now() < this.rateLimitReset) {
			throw new Error("third-party rate-limit reached")
		}

		const response = await fetch(`${this.baseUrl}${path}`)
		this.rateLimitReset = Date.now() + Number(response.headers.get("X-Ratelimit-Reset")) * 1000
		this.rateLimitRemaining = Number(response.headers.get("X-Ratelimit-Remaining"))

		if (response.status === 404) {
			return null
		}

		if (response.status !== 200) {
			throw new Error(`fetch failed: ${response.status} (${response.statusText})`)
		}

		const json = await response.json()
		CacheManager.set(this.baseUrl + path, JSON.stringify(json))

		return json
	}
}
