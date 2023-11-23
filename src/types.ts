import { FastifyRequest } from "fastify"

export interface Query {
	icon: string
	text: string
	name: string
	highlight: string
	background: string

	// allow arbitrary keys that are defined by presets
	[key: string]: string
}

export interface Preset {
	icon: string
	text: string
	name: string
	highlight: string
	background: string[]
}

export interface PresetMap {
	[key: string]: Preset
}

export type PresetRequest = FastifyRequest<{
	Params: {
		preset: string,
	},
	Querystring: Query
}>
