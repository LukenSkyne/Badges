import "dotenv/config"
import fastify, { FastifyReply, FastifyRequest } from "fastify"
import { RequestParser } from "./request-parser"
import { BadgeRenderer } from "./badge-renderer"

const { HOST, PORT, BASE_URL } = process.env
const server = fastify({ logger: true })

server.get(BASE_URL + "/ping", async (_a: FastifyRequest, _b: FastifyReply) => {
	return "pong"
})

server.get(BASE_URL + "/favicon.ico", async (_: FastifyRequest, reply: FastifyReply) => {
	reply.code(404)
})

server.get(BASE_URL + "/:preset/:id?", async (request: PresetRequest, reply: FastifyReply) => {
	const preset = await RequestParser.process(request.params, request.query)
	console.dir(preset, { depth: null })

	const canvas = await BadgeRenderer.render(preset)

	reply.type("image/png")

	return canvas.createPNGStream()
})

server.listen({ host: HOST, port: Number(PORT ?? "3000") }, (err) => {
	if (err) {
		console.error(err)
		process.exit(1)
	}
})
