import "dotenv/config"
import fastify, { FastifyReply, FastifyRequest } from "fastify"
import { CacheManager, CACHE_DURATION } from "./cache-manager"
import { RequestParser, BadRequestError } from "./request-parser"
import { BadgeRenderer } from "./badge-renderer"

const { HOST, PORT, BASE_URL } = process.env
const server = fastify({ logger: true })

setInterval(CacheManager.purge, CACHE_DURATION)

server.register(import("@fastify/rate-limit"), {
	max: 100,
	timeWindow: 6e4,
})

server.register(async (s, _) => {
	s.get("/", (_a: FastifyRequest, _b: FastifyReply) => {
		return "Hello o7"
	})

	s.get("/favicon.ico", async (_: FastifyRequest, reply: FastifyReply) => {
		reply.code(404)
	})

	s.get("/:preset/:id?", async (request: PresetRequest, reply: FastifyReply) => {
		let preset: Preset

		try {
			preset = await RequestParser.process(request.params, request.query)
		} catch (e: any) {
			if (e instanceof BadRequestError) {
				return reply.status(400).send(e.message)
			}

			throw e
		}

		const canvas = await BadgeRenderer.render(preset)

		reply.type("image/png")
		reply.header("Cache-Control", `max-age=${CACHE_DURATION / 1000}, must-revalidate`)

		return canvas.createPNGStream()
	})
}, { prefix: BASE_URL })

server.listen({ host: HOST, port: Number(PORT) }, (err) => {
	if (err) {
		console.error(err)
		process.exit(1)
	}
})
