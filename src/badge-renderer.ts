import opentype from "opentype.js"
import fs from "fs"
import { MathUtils } from "./math-utils"
import { Vec2d } from "./vec-2d"

let fontMedium: opentype.Font
let fontExtraBold: opentype.Font

export class BadgeRenderer {

	static async render(preset: Preset) {
		if (fontMedium === undefined || fontExtraBold === undefined) {
			fontMedium = await opentype.load("./assets/fonts/Inter-Medium.ttf")
			fontExtraBold = await opentype.load("./assets/fonts/Inter-ExtraBold.ttf")
		}

		const scale = 1

		const size = 40 * scale
		const gap = 6 * scale
		const margin = 8 * scale
		const fontSize = 17 * scale
		const iconSize = size - (gap * 2)

		let iconRaw = fs.readFileSync(`./assets/icons/${preset.icon}.svg`, "utf8")
		iconRaw = iconRaw.replace(/currentColor/g, `#${preset.fill}`)
		const iconEncoded = "data:image/svg+xml;base64," + Buffer.from(iconRaw).toString("base64")

		const viewBoxRegex = /viewBox\s*=\s*"\s*([\d.-]+)\s*([\d.-]+)\s*([\d.-]+)\s*([\d.-]+)\s*"/
		const viewBoxMatch = RegExp(viewBoxRegex).exec(iconRaw)

		if (viewBoxMatch === null) {
			throw new Error("no viewbox found")
		}

		let iconWidth = Number(viewBoxMatch[3]) - Number(viewBoxMatch[1])
		let iconHeight = Number(viewBoxMatch[4]) - Number(viewBoxMatch[2])

		const mult = iconSize / Math.max(iconWidth, iconHeight)
		iconWidth *= mult
		iconHeight *= mult

		const text = preset.desc
		const text2 = Array.isArray(preset.name) ? preset.name.map((tok) => tok.text).join("") : preset.name

		const tokens = Array.isArray(preset.name) ? preset.name.map((tok) => ({
			text: tok.text,
			fill: tok.fill,
			metrics: BadgeRenderer.measureText(fontExtraBold, fontSize, tok.text),
		})) : [{
			text: preset.name,
			fill: preset.fill,
			metrics: BadgeRenderer.measureText(fontExtraBold, fontSize, text2),
		}]

		const metrics = BadgeRenderer.measureText(fontMedium, fontSize, text)
		const metrics2 = BadgeRenderer.measureText(fontExtraBold, fontSize, text2)

		const width = margin + iconWidth + gap + Math.round(metrics.width) + gap + Math.round(metrics2.width) + margin
		const descOffX = margin + iconWidth + gap

		const path = fontMedium.getPath(text, descOffX, size * 0.5 + metrics.height / 4 - 0.5, fontSize)
		const pathData = path.toPathData(2)

		const strokeWidth = 2.1 * scale
		const cornerRadius = margin

		const defs = []
		const elems = []

		const bgHasGradient = typeof(preset.bg) !== "string"
		elems.push(`<rect fill="${bgHasGradient ? "url(#bg)" : "#" + preset.bg}" width="${width}" height="${size}" rx="${cornerRadius}" ry="${cornerRadius}"/>`)

		if (bgHasGradient) {
			defs.push(BadgeRenderer.buildGradient(preset.bg, "bg"))
		}

		elems.push(`<rect x="${strokeWidth * 0.5}" y="${strokeWidth * 0.5}" width="${width - strokeWidth}" height="${size - strokeWidth}" fill="none" stroke="#ffffff26" stroke-width="${strokeWidth}" rx="${cornerRadius - strokeWidth * 0.5}" ry="${cornerRadius - strokeWidth * 0.5}"/>`)
		elems.push(`<image href="${iconEncoded}" x="${margin}" y="${gap + Math.round((iconSize - iconHeight) * 0.5)}" width="${iconWidth}" height="${iconHeight}"></image>`)
		elems.push(`<path d="${pathData}" fill="#f8f8f8"/>`)

		let xOff = descOffX + gap + Math.round(metrics.width)

		for (const [i, token] of tokens.entries()) {
			const tokPath = fontExtraBold.getPath(token.text, xOff, size * 0.5 + metrics2.height / 4 - 0.5, fontSize)
			const tokPathData = tokPath.toPathData(2)

			const tokHasGradient = typeof(token.fill) !== "string"
			elems.push(`<path d="${tokPathData}" fill="${tokHasGradient ? "url(#f" + i + ")" : "#" + token.fill}"/>`)

			if (tokHasGradient) {
				defs.push(BadgeRenderer.buildGradient(token.fill, "f" + i))
			}

			xOff += token.metrics.width
		}

		const svg = [`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${size}">`]

		if (defs.length > 0) {
			svg.push("<defs>")
			svg.push(...defs)
			svg.push("</defs>")
		}

		svg.push(...elems)
		svg.push("</svg>")

		return svg.join("")
	}

	private static measureText(font: opentype.Font, fontSize: number, text: string) {
		const glyphs = font.stringToGlyphs(text)

		const textMetrics = glyphs.reduce((acc, glyph) => {
			return acc + (glyph.advanceWidth ? glyph.advanceWidth : 0)
		}, 0) * (fontSize / font.unitsPerEm)

		const ascender = font.ascender * (fontSize / font.unitsPerEm)
		const descender = font.descender * (fontSize / font.unitsPerEm)
		const textHeight = Math.round(ascender - descender * 2)

		return { width: textMetrics, height: textHeight }
	}

	private static buildGradient(color: Color, id: string): string {
		const colors = (color as Gradient).colors ?? color
		const rotation = MathUtils.toRad((color as Gradient).rotation ?? 90)

		const pos = new Vec2d(0, 0)
		const dimensions = new Vec2d(100, 100)
		const center = pos.add(dimensions.mult(0.5))

		const gradientStop = MathUtils.calculateAngledCornerIntersection(pos, dimensions, rotation)
		const gradientStart = center.mult(2).sub(gradientStop)
		const def = [`<linearGradient id="${id}" x1="${Math.round(gradientStart.x)}%" y1="${Math.round(gradientStart.y)}%" x2="${Math.round(gradientStop.x)}%" y2="${Math.round(gradientStop.y)}%">`]

		for (let i = 0; i < colors.length; ++i) {
			def.push(`<stop offset="${Math.round(i / (colors.length - 1) * 100)}%" stop-color="#${colors[i]}" />`)
		}

		def.push(`</linearGradient>`)

		return def.join("")
	}
}
