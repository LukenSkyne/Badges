import "dotenv/config"
import fastify, { FastifyReply, FastifyRequest } from "fastify"
import { RequestParser } from "./request-parser"
import { BadgeRenderer } from "./badge-renderer"

const { HOST, PORT, BASE_URL } = process.env
const server = fastify({ logger: true })

server.register(async (s, _) => {
	s.get("/", (_a: FastifyRequest, _b: FastifyReply) => {
		return "Hello o7"
	})

	s.get("/favicon.ico", async (_: FastifyRequest, reply: FastifyReply) => {
		reply.code(404)
	})

	s.get("/:preset/:id?", async (request: PresetRequest, reply: FastifyReply) => {
		const preset = await RequestParser.process(request.params, request.query)
		console.dir(preset, { depth: null })

		const canvas = await BadgeRenderer.render(preset)

		reply.type("image/png")

		return canvas.createPNGStream()
	})
}, { prefix: BASE_URL })

server.listen({ host: HOST, port: Number(PORT) }, (err) => {
	if (err) {
		console.error(err)
		process.exit(1)
	}
})
