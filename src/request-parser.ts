import fs from "fs"
import presets from "../assets/presets.json"
import { ApiClient } from "./api-client"

const DESCRIPTION_REGEX = /{(?<api>\w+)(?<path>[.\w]+)?(?:\|(?<formatter>\w+))?}\[(?<fallback>\w*)]/
const NAME_REGEX = /\[(?<fill>[\w|/-]+)](?<text>(?:\\\[|[^[])+)/g
const ICON_REGEX = /^[\w-]+$/
const COLOR_REGEX = /^(?=[A-Fa-f0-9]*$)(?:.{3,4}|.{6}|.{8})$/
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

		if (query.icon !== undefined && (!ICON_REGEX.test(query.icon) || !fs.existsSync(`./assets/icons/${query.icon}.svg`))) {
			throw new InvalidRequestError(404, "icon not found")
		}

		return {
			bg: query.bg !== undefined ? this.transformColor(query.bg) : preset.bg,
			icon: query.icon ?? preset.icon,
			fill: query.fill ?? preset.fill,
			desc: await this.transformDescription(query.desc ?? preset.desc, params.id),
			name: query.name !== undefined ? this.transformName(query.name) : preset.name,
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

	private static transformName(name: string): Name {
		const matches = [...name.matchAll(NAME_REGEX)]

		if (matches.length === 0) {
			return name
		}

		return matches.map((match) => {
			return {
				fill: this.transformColor(match.groups!.fill),
				text: match.groups!.text.replace("\\[", "["),
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
		}

		return input
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
