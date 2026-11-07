import fs from "fs"
import presets from "../assets/presets.json"
import { ApiClient } from "./api-client"

const DESCRIPTION_REGEX = /{(?<api>\w+)(?<path>[.\w]+)?(?:\|(?<formatter>\w*))?}\[(?<fallback>\w*)]/
const VIEWBOX_REGEX = /viewBox\s*=\s*"\s*([\d.-]+)\s*([\d.-]+)\s*([\d.-]+)\s*([\d.-]+)\s*"/
const NAME_REGEX = /\[(?<fill>[\w|/-]+)](?<text>(?:\\\[|[^[])+)/g
const COLOR_REGEX = /^(?=[A-Fa-f0-9]*$)(?:.{3,4}|.{6}|.{8})$/
const ICON_REGEX = /^[\w-]+$/
const API_TARGETS: ApiTargetMap = {
	modrinth: {
		validation: /^[A-Za-z0-9]{8}$/,
		client: ApiClient.Modrinth,
	},
	curseforge: {
		validation: /^\d{1,8}$/,
		client: ApiClient.CurseForge,
	},
	cfwidget: {
		validation: /^\d{1,8}$/,
		client: ApiClient.CFWidget,
	},
	duolingo: {
		validation: /^[\w-.]{3,16}$/,
		client: ApiClient.Duolingo,
	}
}

export class InvalidRequestError extends Error {
	statusCode: number

	constructor(statusCode: number, message: string) {
		super(message)
		this.statusCode = statusCode
	}
}

export class RequestParser {

	static async process(params: Params, query: Query): Promise<Preset> {
		const preset = (presets as PresetMap)[params.preset]

		if (preset === undefined) {
			throw new InvalidRequestError(404, "preset not found")
		}

		for (const value of Object.values(query)) {
			if (Array.isArray(value)) {
				throw new InvalidRequestError(400, "duplicate query parameters")
			}
		}

		const fill = query.fill ?? preset.fill

		return {
			bg: query.bg !== undefined ? this.transformColor(query.bg) : preset.bg,
			icon: this.transformIcon(query.icon ?? preset.icon),
			fill,
			desc: await this.transformDescription(query.desc ?? preset.desc, params.id),
			name: this.transformName(query.name ?? preset.name, fill)
		}
	}

	private static transformIcon(icon: string): Icon {
		if (icon.length < 64) {
			if (!ICON_REGEX.test(icon)) {
				throw new InvalidRequestError(400, "invalid icon name")
			}

			const path = `./assets/icons/${icon}.svg`

			if (!fs.existsSync(path)) {
				throw new InvalidRequestError(404, "icon not found")
			}

			icon = fs.readFileSync(path, "utf8")
		}

		const viewBoxMatch = RegExp(VIEWBOX_REGEX).exec(icon)

		if (viewBoxMatch === null) {
			throw new InvalidRequestError(400, "svg viewbox missing")
		}

		return {
			content: icon,
			width: Number(viewBoxMatch[3]) - Number(viewBoxMatch[1]),
			height: Number(viewBoxMatch[4]) - Number(viewBoxMatch[2]),
		}
	}

	private static transformColor(color: string): Color {
		const [gradient, rotation] = color.split("/")
		const colors = gradient.split("|")

		for (const col of colors) {
			if (!COLOR_REGEX.test(col)) {
				throw new InvalidRequestError(400, "invalid color code")
			}
		}

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

	private static transformName(name: string | Token[], fill: string): Token[] {
		if (Array.isArray(name)) {
			return name
		}

		const matches = [...name.matchAll(NAME_REGEX)]

		if (matches.length === 0) {
			return [{
				text: name,
				fill,
			}]
		}

		return matches.map((match) => {
			return {
				text: match.groups!.text.replace("\\[", "["),
				fill: this.transformColor(match.groups!.fill),
			}
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

		if (!Object.hasOwn(API_TARGETS, api)) {
			throw new InvalidRequestError(404, "api not found")
		}

		const target = API_TARGETS[api]

		if (!target.validation.test(id)) {
			throw new InvalidRequestError(400, `invalid ${api} id`)
		}

		data = await target.client.get(id)

		if (data === null) {
			return "PROJECT_NOT_FOUND"
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
			case "days": {
				return input + " days";
			}
			case "":
				throw new InvalidRequestError(400, "invalid formatter name")
			default:
				throw new InvalidRequestError(404, "unknown formatter name")
		}
	}

	private static formatNumber(num: number) {
		if (num >= 1_000_000) {
			return (num / 1_000_000).toFixed(1) + "M"
		} else if (num >= 1000) {
			return (num / 1000).toFixed(1) + "k"
		}

		return num.toString()
	}
}
