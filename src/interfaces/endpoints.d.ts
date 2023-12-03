
interface Params {
	preset: string
	id?: string
}

interface Query {
	bg?: string
	fill?: string
	icon?: string
	desc?: string
	name?: string
}

type PresetRequest = import("fastify").FastifyRequest<{
	Params: Params
	Querystring: Query
}>
