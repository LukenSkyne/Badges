import opentype from "opentype.js"
import { Vec2d } from "./vec-2d"
import { MathUtils } from "./math-utils"
import { SvgBuilder } from "./svg-builder"

let fontMedium: opentype.Font
let fontExtraBold: opentype.Font

export class BadgeRenderer {

	static async render(preset: Preset) {
		if (fontMedium === undefined || fontExtraBold === undefined) {
			fontMedium = await opentype.load("./assets/fonts/Inter-Medium.ttf")
			fontExtraBold = await opentype.load("./assets/fonts/Inter-ExtraBold.ttf")
		}

		const scale = 1
		const gap = 6 * scale
		const margin = 8 * scale
		const height = 40 * scale
		const fontSize = 17 * scale
		const strokeWidth = 2.1 * scale

		const iconRaw = preset.icon.content.replace(/currentColor/g, `#${preset.fill}`)
		const iconEncoded = "data:image/svg+xml;base64," + Buffer.from(iconRaw).toString("base64")
		let iconWidth = preset.icon.width
		let iconHeight = preset.icon.height
		const iconSize = height - (gap * 2)
		const mult = iconSize / Math.max(iconWidth, iconHeight)
		iconWidth *= mult
		iconHeight *= mult

		const desc = preset.desc
		const descMetrics = BadgeRenderer.measureText(fontMedium, fontSize, desc)
		let nameWidth = 0
		const tokens = preset.name.map((tok) => {
			const metrics = BadgeRenderer.measureText(fontExtraBold, fontSize, tok.text)
			nameWidth += metrics.width

			return {
				text: tok.text,
				fill: tok.fill,
				metrics,
			}
		})

		const width = margin + iconWidth + gap + Math.round(descMetrics.width) + gap + Math.round(nameWidth) + margin
		const descOffset = margin + iconWidth + gap

		const path = fontMedium.getPath(desc, descOffset, height * 0.5 + descMetrics.height / 4 - 0.5, fontSize)
		const pathData = path.toPathData(2)

		const svg = SvgBuilder.svg()
			.width(width)
			.height(height)

		const defs = SvgBuilder.defs()
		svg.append(defs)

		const bgHasGradient = typeof(preset.bg) !== "string"

		if (bgHasGradient) {
			defs.append(BadgeRenderer.buildGradient(preset.bg, "bg"))
		}

		svg.append(
			SvgBuilder.rect()
				.fill(bgHasGradient ? "url(#bg)" : "#" + preset.bg)
				.width(width)
				.height(height)
				.radius(margin)
		)
		svg.append(
			SvgBuilder.rect()
				.pos(strokeWidth * 0.5)
				.width(width - strokeWidth)
				.height(height - strokeWidth)
				.fill("none")
				.stroke("#ffffff26", strokeWidth)
				.radius(margin - strokeWidth * 0.5)
		)
		svg.append(
			SvgBuilder.image()
				.href(iconEncoded)
				.pos(margin, gap + Math.round((iconSize - iconHeight) * 0.5))
				.width(iconWidth)
				.height(iconHeight)
		)
		svg.append(
			SvgBuilder.path()
				.data(pathData)
				.fill("#f8f8f8")
		)

		let tokenOffset = descOffset + gap + Math.round(descMetrics.width)

		for (const [i, token] of tokens.entries()) {
			const tokPath = fontExtraBold.getPath(token.text, tokenOffset, height * 0.5 + token.metrics.height / 4 - 0.5, fontSize)
			const tokPathData = tokPath.toPathData(2)
			const tokHasGradient = typeof(token.fill) !== "string"

			if (tokHasGradient) {
				defs.append(BadgeRenderer.buildGradient(token.fill, "f" + i))
			}

			svg.append(
				SvgBuilder.path()
					.data(tokPathData)
					.fill(tokHasGradient ? `url(#f${i})` : "#" + token.fill)
			)

			tokenOffset += token.metrics.width
		}

		return svg.get()
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

		const gradient = SvgBuilder.linearGradient()
			.id(id)
			.posEx(Math.round(gradientStart.x), Math.round(gradientStart.y), "1", "%")
			.posEx(Math.round(gradientStop.x), Math.round(gradientStop.y), "2", "%")

		for (let i = 0; i < colors.length; ++i) {
			gradient.appendStop(Math.round(i / (colors.length - 1) * 100), "#" + colors[i])
		}

		return gradient.get()
	}
}
