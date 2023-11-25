import { FastifyRequest } from "fastify"

export interface Params {
	preset: string
	id?: string
}

export interface Query {
	bg: string
	fill: string
	icon: string
	desc: string
	name: string
}

export type PresetRequest = FastifyRequest<{
	Params: Params
	Querystring: Query
}>

export interface Gradient {
	colors: string[]
	rotation: number
}

export type Color = string | string[] | Gradient

export interface Token {
	text: string
	fill: Color
}

export type Name = string | Token[]

export interface Preset {
	bg: Color
	fill: string
	icon: string
	desc: string
	name: Name
}

export interface PresetMap {
	[key: string]: Preset
}
