import { CanvasGradient, CanvasRenderingContext2D, createCanvas, loadImage, registerFont } from "canvas"
import fs from "fs"
import { Color, Gradient, Preset } from "./types"
import { MathUtils } from "./math-utils"
import { Vec2d } from "./vec-2d"

const dummyCanvas = createCanvas(1, 1)
const dummyCtx = dummyCanvas.getContext("2d")

registerFont("./assets/fonts/Inter-Medium.ttf", { family: "Inter Medium" })
registerFont("./assets/fonts/Inter-ExtraBold.ttf", { family: "Inter ExtraBold" })

export class BadgeRenderer {

	private static buildGradient(ctx: CanvasRenderingContext2D, color: Color, x: number, y: number, width: number, height: number): string | CanvasGradient {
		const colors = (color as Gradient).colors ?? color

		if (!Array.isArray(colors)) {
			return `#${colors}`
		}

		const rotation = MathUtils.toRad((color as Gradient).rotation ?? 90)

		const pos = new Vec2d(x, y)
		const dimensions = new Vec2d(width, height)
		const center = pos.add(dimensions.mult(0.5))

		const gradientStop = MathUtils.calculateAngledCornerIntersection(pos, dimensions, rotation)
		const gradientStart = center.mult(2).sub(gradientStop)
		const grd = ctx.createLinearGradient(gradientStart.x, gradientStart.y, gradientStop.x, gradientStop.y)

		for (let i = 0; i < colors.length; ++i) {
			grd.addColorStop(i / (colors.length - 1), `#${colors[i]}`)
		}

		return grd
	}

	static async render(preset: Preset) {
		const scale = 1

		let width = 40 * scale
		const height = 40 * scale

		const text = preset.desc
		const text2 = Array.isArray(preset.name) ? preset.name.map((tok) => tok.text).join("") : preset.name


		const tokens = Array.isArray(preset.name) ? preset.name.map((tok) => ({
			text: tok.text,
			fill: tok.fill,
			metrics: BadgeRenderer.measureText("17px Inter ExtraBold", tok.text),
		})) : [{
			text: preset.name,
			fill: preset.fill,
			metrics: BadgeRenderer.measureText("17px Inter ExtraBold", text2),
		}]

		const metrics = BadgeRenderer.measureText("17px Inter Medium", text)
		const metrics2 = BadgeRenderer.measureText("17px Inter ExtraBold", text2)

		width += Math.round(metrics.width) + (6 * scale) + Math.round(metrics2.width) + (8 * scale)

		const canvas = createCanvas(width, height)
		const ctx = canvas.getContext("2d")
		{
			const grd = BadgeRenderer.buildGradient(ctx, preset.bg, 0, 0, width, height)

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
			ctx.fillStyle = "#e8e8e8"
			ctx.textAlign = "left"
			ctx.textBaseline = "middle"
			ctx.fillText(text, height, height * 0.5)

			ctx.font = "17px Inter ExtraBold"
			//ctx.fillStyle = "#f16436"
			ctx.fillStyle = `#${preset.fill}`
			ctx.textAlign = "left"
			ctx.textBaseline = "middle"
			//ctx.fillText(text2, height + (6 * scale) + Math.round(metrics.width), height * 0.5)


			let xOff = height + (6 * scale) + Math.round(metrics.width)

			for (const tok of tokens) {
				const tokGradient = BadgeRenderer.buildGradient(
					ctx,
					tok.fill,
					xOff,
					height * 0.5 - 17 * 0.5,
					tok.metrics.width,
					17
				)

				/*
				ctx.fillStyle = "#f00a"
				ctx.fillRect(xOff,
					height * 0.5 - 17 * 0.5,
					tok.metrics.width,
					17)
				*/

				ctx.fillStyle = tokGradient
				ctx.fillText(tok.text, xOff, height * 0.5)

				xOff += tok.metrics.width
			}

			//ctx.drawImage(svgImage, 0, 0, 200, 200)

			let svgContent = fs.readFileSync(`./assets/icons/${preset.icon}.svg`, "utf8")
			svgContent = svgContent.replace(/currentColor/g, `#${preset.fill}`)

			const svg = await loadImage(`data:image/svg+xml;utf8,${svgContent}`)
			const iconSize = height - pad * 2

			svg.width = svg.width * scale
			svg.height = svg.height * scale

			const mult = iconSize / Math.max(svg.width, svg.height)
			svg.width *= mult
			svg.height *= mult

			ctx.drawImage(svg, Math.round(pad + (iconSize - svg.width) * 0.5), Math.round(pad + (iconSize - svg.height) * 0.5), svg.width, svg.height)

			//ctx.fillStyle = "#fffa"
			//ctx.fillRect(Math.round(pad + (iconSize - svg.width) * 0.5), Math.round(pad + (iconSize - svg.height) * 0.5), svg.width, svg.height)
		}

		return canvas
	}

	private static measureText(font: string, text: string) {
		dummyCtx.font = font
		return dummyCtx.measureText(text)
	}
}
