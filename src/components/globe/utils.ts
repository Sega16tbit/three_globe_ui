import { Vector3 } from "three";

export function latLonToVector3(lat: number, lon: number, radius = 1) {
	const phi = ((90 - lat) * Math.PI) / 180;
	const theta = ((lon + 180) * Math.PI) / 180;

	return new Vector3(
		-radius * Math.sin(phi) * Math.cos(theta),
		radius * Math.cos(phi),
		radius * Math.sin(phi) * Math.sin(theta)
	);
}

/**
 * Framerate independent lerp alternative.
 *
 * @param a Current value
 * @param b Target value
 * @param decay Decay strength. Useful range approx. 1 to 25, from slow to fast
 * @param dt DeltaTime
 *
 * @see https://www.youtube.com/watch?v=LSNQuFEDOyQ&t=2979
 *
 * @example
 * const deltaTime = now - prev;
 * const decay = 16;
 * const target = 0;
 * const current = 10;

 * current = expDecay(current, target, decay, deltaTime);
 */
export function expDecay(a: number, b: number, decay = 16, dt: number) {
	return b + (a - b) * Math.exp(-decay * dt);
}
