
class SvgElement {

	name: string
	props: string[]
	children: Child[]

	constructor(name: string) {
		this.name = name
		this.props = [name]
		this.children = []
	}

	id(v: string) {
		this.prop("id", v)
		return this
	}

	pos(x: number, y?: number) {
		this.posEx(x, y ?? x)
		return this
	}

	posEx(x: number, y: number, index: string = "", unit: string = "") {
		this.prop("x" + index, x + unit)
		this.prop("y" + index, y + unit)
		return this
	}

	appendStop(offset: number, color: string) {
		this.append(
			new SvgElement("stop")
				.offset(offset)
				.stopColor(color)
				.get()
		)
		return this
	}

	offset(percent: number) {
		this.prop("offset", `${percent}%`)
		return this
	}

	stopColor(color: string) {
		this.prop("stop-color", color)
		return this
	}

	width(w: number) {
		this.prop("width", w)
		return this
	}

	height(h: number) {
		this.prop("height", h)
		return this
	}

	size(s: number) {
		return this.width(s).height(s)
	}

	fill(v: string) {
		this.prop("fill", v)
		return this
	}

	stroke(v: string, width: number) {
		this.prop("stroke", v)
		this.prop("stroke-width", width)
		return this
	}

	radius(r: number) {
		return this.radiusX(r).radiusY(r)
	}

	radiusX(rx: number) {
		this.prop("rx", rx)
		return this
	}

	radiusY(ry: number) {
		this.prop("ry", ry)
		return this
	}

	href(href: string) {
		this.prop("href", href)
		return this
	}

	data(data: string) {
		this.prop("d", data)
		return this
	}

	prop(property: string, value: number | string) {
		this.props.push(`${property}="${value}"`)
		return this
	}

	append(child: Child) {
		this.children.push(child)
		return this
	}

	get() {
		if (this.children.length === 0) {
			if (this.props.length === 1) {
				return ""
			}

			return [ "<", this.props.join(" "), "/>" ].join("")
		}

		this.children = this.children.map((child) => typeof(child) !== "string" ? child.get() : child)

		return [
			"<", this.props.join(" "), ">",
			this.children.join(""),
			"</", this.name, ">",
		].join("")
	}
}

export class SvgBuilder {
	static svg() { return new SvgElement("svg").prop("xmlns", "http://www.w3.org/2000/svg") }
	static defs() { return new SvgElement("defs") }
	static linearGradient() { return new SvgElement("linearGradient") }
	static rect() { return new SvgElement("rect") }
	static image() { return new SvgElement("image") }
	static path() { return new SvgElement("path") }
}
