import { CanvasGradient, CanvasRenderingContext2D, createCanvas, loadImage, registerFont } from "canvas"
import fs from "fs"
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
		
		const size = 40 * scale
		const gap = 6 * scale
		const margin = 8 * scale
		const fontSize = 17 * scale
		const iconSize = size - (gap * 2)
		const fontMedium = `${fontSize}px Inter Medium`
		const fontExtraBold = `${fontSize}px Inter ExtraBold`

		let svgContent = fs.readFileSync(`./assets/icons/${preset.icon}.svg`, "utf8")
		svgContent = svgContent.replace(/currentColor/g, `#${preset.fill}`)

		const icon = await loadImage(`data:image/svg+xml;utf8,${svgContent}`)
		icon.width *= scale
		icon.height *= scale
		const mult = iconSize / Math.max(icon.width, icon.height)
		icon.width *= mult
		icon.height *= mult

		const text = preset.desc
		const text2 = Array.isArray(preset.name) ? preset.name.map((tok) => tok.text).join("") : preset.name

		const tokens = Array.isArray(preset.name) ? preset.name.map((tok) => ({
			text: tok.text,
			fill: tok.fill,
			metrics: BadgeRenderer.measureText(fontExtraBold, tok.text),
		})) : [{
			text: preset.name,
			fill: preset.fill,
			metrics: BadgeRenderer.measureText(fontExtraBold, text2),
		}]

		const metrics = BadgeRenderer.measureText(fontMedium, text)
		const metrics2 = BadgeRenderer.measureText(fontExtraBold, text2)

		const width = margin + icon.width + gap + Math.round(metrics.width) + gap + Math.round(metrics2.width) + margin

		const canvas = createCanvas(width, size)
		const ctx = canvas.getContext("2d")
		{
			const grd = BadgeRenderer.buildGradient(ctx, preset.bg, 0, 0, width, size)

			// bg
			const cornerRadius = 8 * scale
			ctx.beginPath()
			ctx.roundRect(0, 0, width, size, cornerRadius)
			ctx.fillStyle = grd
			ctx.fill()

			// border
			const sw = 2.1 * scale
			ctx.beginPath()
			ctx.roundRect(sw * 0.5, sw * 0.5, width - sw, size - sw, cornerRadius - sw * 0.5)
			ctx.strokeStyle = "#ffffff26"
			ctx.lineWidth = sw
			ctx.stroke()

			// icon
			ctx.drawImage(icon, margin, gap + Math.round((iconSize - icon.height) * 0.5), icon.width, icon.height)

			// desc
			const descOffX = margin + icon.width + gap
			ctx.font = fontMedium
			ctx.fillStyle = "#e8e8e8"
			ctx.textAlign = "left"
			ctx.textBaseline = "middle"
			ctx.fillText(text, descOffX, size * 0.5)

			// name
			let xOff = descOffX + gap + Math.round(metrics.width)
			ctx.font = fontExtraBold

			for (const token of tokens) {
				ctx.fillStyle = BadgeRenderer.buildGradient(
					ctx,
					token.fill,
					xOff,
					size * 0.5 - fontSize * 0.5,
					token.metrics.width,
					fontSize
				)
				ctx.fillText(token.text, xOff, size * 0.5)

				xOff += token.metrics.width
			}
		}

		return canvas
	}

	private static measureText(font: string, text: string) {
		dummyCtx.font = font
		return dummyCtx.measureText(text)
	}
}
