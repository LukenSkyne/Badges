import { repository, version } from "../package.json"
import { CacheManager } from "./cache-manager"

export class ApiClient {

	static Modrinth = new ApiClient((id) => `https://api.modrinth.com/v2/project/${id}`)
	static CurseForge = new ApiClient((id) => `https://api.curseforge.com/v1/mods/${id}`, { "x-api-key": process.env.CF_API_KEY })
	static CFWidget = new ApiClient((id) => `https://api.cfwidget.com/${id}`)
	static Duolingo = new ApiClient((id) => `https://www.duolingo.com/2017-06-30/users?username=${id}&fields=streak,streakData%7BcurrentStreak,previousStreak%7D%7D`)

	/** Url builder takes the user id and returns the url string */
	urlBuilder: (id: string) => string;
	headers: Headers
	rateLimitReset: number | null
	rateLimitRemaining: number | null

	constructor(urlBuilder: (id: string) => string, headers?: object) {
		this.urlBuilder = urlBuilder

		this.headers = new Headers({
			"Content-Type": "application/json",
			"Accept": "application/json",
			"User-Agent": `${repository?.split(":")[1]}/${version} (${process.env.CONTACT_EMAIL || "unknown fork"})`,
			...headers,
		})
		this.rateLimitReset = null
		this.rateLimitRemaining = null
	}

	async get(id: string) {
		const fullPath = this.urlBuilder(id)

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
