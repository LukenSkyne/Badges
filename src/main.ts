import "dotenv/config"
import fastify, { FastifyReply, FastifyRequest } from "fastify"
import { RequestParser } from "./request-parser"
import { PresetRequest } from "./types"
import { BadgeRenderer } from "./badge-renderer"

const { HOST, PORT, BASE_URL } = process.env
const server = fastify({ logger: true })

server.get(BASE_URL + "/ping", async (request: FastifyRequest, reply: FastifyReply) => {
	return "pong"
})

server.get(BASE_URL + "/:preset", async (request: PresetRequest, reply: FastifyReply) => {
	const presetName = request.params.preset

	const preset = await RequestParser.process(presetName, request.query)

	console.log("preset", preset)

	const canvas = await BadgeRenderer.render(preset)

	reply.type("image/png")

	return canvas.createPNGStream()
})

server.listen({ host: HOST, port: parseInt(PORT ?? "3000") }, (err) => {
	if (err) {
		console.error(err)
		process.exit(1)
	}
})
