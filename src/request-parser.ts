import presets from "../assets/presets.json"
import { ApiClient } from "./api-client"

const DESCRIPTION_REGEX = /{(?<api>\w+)(?<path>[.\w]+)?(?:\|(?<formatter>\w+))?}\[(?<fallback>\w*)]/
const NAME_REGEX = /\[(?<fill>[\w|/-]+)](?<text>(?:\\\[|[^[])+)/g

const modrinth = new ApiClient("https://api.modrinth.com/v2")
const cfwidget = new ApiClient("https://api.cfwidget.com")

export class RequestParser {

	static async process(params: Params, query: Query): Promise<Preset> {
		const preset = (presets as PresetMap)[params.preset]

		if (preset === undefined) {
			throw new Error("unknown preset")
		}

		return {
			bg: query.bg !== undefined ? this.transformColor(query.bg) : preset.bg,
			icon: query.icon ?? preset.icon,
			fill: query.fill ?? preset.fill,
			desc: await this.transformDescription(query.desc ?? preset.desc, params.id),
			name: query.name !== undefined ? this.transformName(query.name) : preset.name,
		}
	}

	private static transformColor(colorFormat: string): Color {
		const [gradient, rotation] = colorFormat.split("/")
		const colors = gradient.split("|")

		if (colors.length < 2) {
			return colors[0]
		}

		if (rotation === undefined) {
			return colors
		}

		return {
			colors,
			rotation: Number(rotation),
		}
	}

	private static transformName(name: string): Name {
		const matches = [...name.matchAll(NAME_REGEX)]

		if (matches.length === 0) {
			return name
		}

		return matches.map((match) => {
			if (match.groups === undefined) {
				throw new Error("NAME_REGEX_INVALID_MATCH")
			}

			return {
				fill: this.transformColor(match.groups.fill),
				text: match.groups.text,
			} satisfies Token
		})
	}

	private static async transformDescription(description: string, id?: string): Promise<string> {
		const match = DESCRIPTION_REGEX.exec(description)

		if (match === null || match.groups === undefined) {
			return description
		}

		if (id === undefined) {
			return description.replace(DESCRIPTION_REGEX, match.groups.fallback)
		}

		const result = await this.fetchApi(match.groups.api, id, match.groups.path)

		return description.replace(DESCRIPTION_REGEX, this.applyFormat(result, match.groups.formatter))
	}

	private static async fetchApi(api: string, id: string, path: string) {
		const pathArr = path.split(".").slice(1)
		let data

		if (id === undefined) {
			return "NO_PARAM"
		}

		switch (api) {
			case "modrinth":
				data = await modrinth.get(`/project/${id}`)

				if (data === null) {
					return "PROJECT_NOT_FOUND"
				}
				break
			case "curseforge":
				data = await cfwidget.get(`/${id}`)

				if (data === null) {
					return "PROJECT_NOT_FOUND"
				}
				break
		}

		for (const p of pathArr) {
			data = data[p]

			if (data === undefined) {
				return "JSON_PATH_INVALID"
			}
		}

		return data
	}

	private static applyFormat(input: any, formatter: string) {
		switch (formatter) {
			case "num": {
				return this.formatNumber(input)
			}
		}

		return input
	}

	private static formatNumber(num: number) {
		if (num >= 1000000) {
			return (num / 1000000).toFixed(1) + "M"
		} else if (num >= 1000) {
			return (num / 1000).toFixed(1) + "k"
		}

		return num.toString()
	}
}
