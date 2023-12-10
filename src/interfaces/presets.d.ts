
interface Gradient {
	colors: string[]
	rotation: number
}

type Color = string | string[] | Gradient

interface Token {
	text: string
	fill: Color
}

type Name = string | Token[]

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
	name: Name
}

interface PresetJson extends Preset {
	icon: string
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
