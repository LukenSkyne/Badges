import { createCanvas, loadImage, registerFont } from "canvas"
import fs from "fs"
import { Preset } from "./types"

const dummyCanvas = createCanvas(1, 1)
const dummyCtx = dummyCanvas.getContext("2d")

registerFont("./assets/fonts/Inter-Medium.ttf", { family: "Inter Medium" })
registerFont("./assets/fonts/Inter-ExtraBold.ttf", { family: "Inter ExtraBold" })

export class BadgeRenderer {

	static async render(preset: Preset) {
		const scale = 1

		let width = 40 * scale
		const height = 40 * scale

		const text = preset.text
		const text2 = preset.name

		const metrics = BadgeRenderer.measureText("17px Inter Medium", text)
		const metrics2 = BadgeRenderer.measureText("17px Inter ExtraBold", text2)

		width += Math.round(metrics.width) + (6 * scale) + Math.round(metrics2.width) + (8 * scale)

		const canvas = createCanvas(width, height)
		const ctx = canvas.getContext("2d")
		{
			const grd = ctx.createLinearGradient(0, 0, 0, height)

			for (let i = 0; i < preset.background.length; ++i) {
				grd.addColorStop(i / (preset.background.length - 1), `#${preset.background[i]}`)
			}

			const size = height
			const cornerRadius = 8 * scale
			ctx.beginPath()
			ctx.roundRect(0, 0, width, height, cornerRadius)
			ctx.fillStyle = grd
			ctx.fill()

			const sw = 2.1 * scale
			ctx.beginPath()
			ctx.roundRect(sw * 0.5, sw * 0.5, width - sw, height - sw, cornerRadius - sw * 0.5)
			ctx.strokeStyle = "#ffffff26"
			ctx.lineWidth = sw
			ctx.stroke()


			const pad = 6 * scale
			//ctx.beginPath()
			//ctx.fillStyle = "gray"
			//ctx.rect(pad, pad, height - pad * 2, height - pad * 2)
			//ctx.fill()

			ctx.font = "17px Inter Medium"
			ctx.fillStyle = "white"
			ctx.textAlign = "left"
			ctx.textBaseline = "middle"
			ctx.fillText(text, height, height * 0.5)

			ctx.font = "17px Inter ExtraBold"
			//ctx.fillStyle = "#f16436"
			ctx.fillStyle = `#${preset.highlight}`
			ctx.textAlign = "left"
			ctx.textBaseline = "middle"
			ctx.fillText(text2, height + (6 * scale) + Math.round(metrics.width), height * 0.5)

			//ctx.drawImage(svgImage, 0, 0, 200, 200)

			let svgContent = fs.readFileSync(`./assets/icons/${preset.icon}.svg`, "utf8")
			svgContent = svgContent.replace(/currentColor/g, `#${preset.highlight}`)

			const svg = await loadImage(`data:image/svg+xml;utf8,${svgContent}`)
			const iconSize = height - pad * 2

			svg.width = svg.width * scale
			svg.height = svg.height * scale

			const mult = iconSize / Math.max(svg.width, svg.height)
			svg.width *= mult
			svg.height *= mult

			ctx.drawImage(svg, Math.round(pad + (iconSize - svg.width) * 0.5), Math.round(pad + (iconSize - svg.height) * 0.5), svg.width, svg.height)
		}

		return canvas
	}

	private static measureText(font: string, text: string) {
		dummyCtx.font = font
		return dummyCtx.measureText(text)
	}
}
