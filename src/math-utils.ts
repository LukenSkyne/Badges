import { Vec2d } from "./vec-2d"

export class MathUtils {

	static readonly HALF_PI = Math.PI * 0.5
	static readonly TO_DEGREES = 180 / Math.PI
	static readonly TO_RADIANS = Math.PI / 180

	static toDeg(rad: number) {
		return rad * this.TO_DEGREES
	}

	static toRad(deg: number) {
		return deg * this.TO_RADIANS
	}

	static calculateAngledCornerIntersection(pos: Vec2d, dimensions: Vec2d, theta: number) {
		const center = pos.add(dimensions.mult(0.5))
		let corner: Vec2d

		if (theta > this.HALF_PI) {
			corner = new Vec2d(pos.x, pos.y + dimensions.y)
		} else if (theta > 0) {
			corner = new Vec2d(pos.x + dimensions.x, pos.y + dimensions.y)
		} else if (theta < -this.HALF_PI) {
			corner = new Vec2d(pos.x, pos.y)
		} else {
			corner = new Vec2d(pos.x + dimensions.x, pos.y)
		}

		return this.calculateLineIntersection(center, corner, theta, theta + this.HALF_PI)!
	}

	private static calculateLineIntersection(p1: Vec2d, p2: Vec2d, theta1: number, theta2: number) {
		const d1 = Vec2d.fromAngle(theta1)
		const d2 = Vec2d.fromAngle(theta2)
		const det = d1.determinant(d2)

		if (det === 0) {
			return undefined
		}

		const t = ((p2.x - p1.x) * d2.y - (p2.y - p1.y) * d2.x) / det

		return new Vec2d(p1.x + t * d1.x, p1.y + t * d1.y)
	}
}
