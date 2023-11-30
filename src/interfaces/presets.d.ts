
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

interface Preset {
	bg: Color
	fill: string
	icon: string
	desc: string
	name: Name
}

interface PresetMap {
	[key: string]: Preset
}

interface ApiTarget {
	validation: RegExp
	client: import("../api-client").ApiClient
}

interface ApiTargetMap {
	[key: string]: ApiTarget
}
