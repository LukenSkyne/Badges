import { repository, version } from "../package.json"
import { CacheManager } from "./cache-manager"

export class ApiClient {

	static Modrinth = new ApiClient("https://api.modrinth.com/v2/project/")
	static CurseForge = new ApiClient("https://api.curseforge.com/v1/mods/", { "x-api-key": process.env.CF_API_KEY })
	static CFWidget = new ApiClient("https://api.cfwidget.com/")

	url: string
	headers: Headers
	rateLimitReset: number | null
	rateLimitRemaining: number | null

	constructor(url: string, headers?: object) {
		this.url = url
		this.headers = new Headers({
			"Content-Type": "application/json",
			"Accept": "application/json",
			"User-Agent": `${repository?.split(":")[1]}/${version} (${process.env.CONTACT_EMAIL || "unknown fork"})`,
			...headers,
		})
		this.rateLimitReset = null
		this.rateLimitRemaining = null
	}

	async get(path: string) {
		const fullPath = this.url + path
		const cachedResult = CacheManager.get(fullPath)

		if (cachedResult !== null) {
			return cachedResult
		}

		if (this.rateLimitRemaining !== null && this.rateLimitReset !== null &&
			this.rateLimitRemaining < 1 && Date.now() < this.rateLimitReset) {
			throw new Error("third-party rate-limit reached")
		}

		const response = await fetch(fullPath, { headers: this.headers })
		this.rateLimitReset = Date.now() + Number(response.headers.get("X-Ratelimit-Reset")) * 1000
		this.rateLimitRemaining = Number(response.headers.get("X-Ratelimit-Remaining"))

		if (response.status === 404) {
			return null
		}

		if (response.status !== 200) {
			throw new Error(`fetch failed: ${response.status} (${response.statusText})`)
		}

		const json = await response.json()
		CacheManager.set(fullPath, JSON.stringify(json))

		return json
	}
}
