
interface Gradient {
	colors: string[]
	rotation: number
}

type Color = string | string[] | Gradient

interface Token {
	text: string
	fill: Color
}

interface Icon {
	content: string
	width: number
	height: number
}

interface Preset {
	bg: Color
	fill: string
	icon: Icon
	desc: string
	name: Token[]
}

interface PresetJson extends Preset {
	icon: string
	name: string | Token[]
}

interface PresetMap {
	[key: string]: PresetJson
}

interface ApiTarget {
	validation: RegExp
	client: import("../api-client").ApiClient
}

interface ApiTargetMap {
	[key: string]: ApiTarget
}
