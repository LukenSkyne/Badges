
export class Vec2d {

	x: number
	y: number

	constructor(x: number, y: number) {
		this.x = x
		this.y = y
	}

	static fromAngle(theta: number) {
		return new Vec2d(Math.cos(theta), Math.sin(theta))
	}

	add(b: Vec2d) {
		return new Vec2d(this.x + b.x, this.y + b.y)
	}

	sub(b: Vec2d) {
		return new Vec2d(this.x - b.x, this.y - b.y)
	}

	mult(v: number) {
		return new Vec2d(this.x * v, this.y * v)
	}

	determinant(b: Vec2d) {
		return this.x * b.y - this.y * b.x
	}
}
