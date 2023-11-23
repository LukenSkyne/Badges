import presets from "../assets/presets.json"
import { Preset, PresetMap, Query } from "./types"

export class RequestParser {

	static async process(presetName: string, query: Query): Promise<Preset> {
		const preset = (presets as PresetMap)[presetName]

		if (preset === undefined) {
			throw new Error("unknown preset")
		}

		return {
			icon: query.icon ?? preset.icon,
			text: await RequestParser.transformDescription(query.text ?? preset.text, query),
			name: query.name ?? preset.name,
			highlight: query.highlight ?? preset.highlight,
			background: query.background?.split(">") ?? preset.background,
		}
	}

	private static async transformDescription(format: string, query: Query): Promise<string> {
		const formatRegex = /{(?<api>\w+)\((?<param>[A-Za-z0-9]*)\)(?<path>[.\w]+)?(?:\|(?<format>\w+))?}\[(?<fallback>\w*)\]/
		const match = format.match(formatRegex)

		if (match === null || match.groups === undefined) {
			return format
		}

		const param = match.groups.param

		if (!Object.hasOwn(query, param)) {
			return format.replace(formatRegex, match.groups.fallback)
		}

		const result = await RequestParser.fetchApi(match.groups.api, query[param], match.groups.path)

		return format.replace(formatRegex, RequestParser.applyFormat(result, match.groups.format))
	}

	private static async fetchApi(api: string, param: string, path: string) {
		const pathArr = path.split(".").slice(1)
		let data

		if (param === undefined) {
			return "NO_PARAM"
		}

		// TODO: handle failed response
		switch (api) {
			case "modrinth": {
				const response = await fetch(`https://api.modrinth.com/v2/project/${param}`)
				data = await response.json()
			} break
			case "curseforge": {
				const response = await fetch(`https://api.cfwidget.com/${param}`)
				data = await response.json()
			} break
		}

		for (const p of pathArr) {
			if (data === undefined) {
				return "OUT_OF_JSON"
			}

			data = data[p]
		}

		return data
	}

	private static applyFormat(whatever: any, format: string) {
		switch (format) {
			case "num": {
				return RequestParser.formatNumber(whatever)
			}
		}

		return whatever
	}

	private static formatNumber(num: number) {
		if (num >= 1000000) {
			return (num / 1000000).toFixed(1) + "M"
		} else if (num >= 1000) {
			return (num / 1000).toFixed(0) + "k"
		}

		return num.toString()
	}
}
