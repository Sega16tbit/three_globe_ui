import { OrthographicCamera, Vector2 } from "three";

export function expDecay(a: number, b: number, decay = 16, dt: number) {
	return b + (a - b) * Math.exp(-decay * dt);
}

type ZoomFractOptions = {
	disableUserInput?: boolean;
};

type Options = {
	minScale?: number;
	maxScale?: number;
	wheelSpeed?: number;
	pinchSpeed?: number;
	enablePanX?: boolean;
	lockScreenY?: number;
	expDecayStrengthWheel?: number;
	expDecayStrengthTouch?: number;
	expDecayStrengthFract?: number;
};

export class OrthoZoomControls {
	private camera: OrthographicCamera;
	private dom: HTMLElement;

	private minScale: number;
	private maxScale: number;
	private wheelSpeed: number;
	private pinchSpeed: number;
	private enablePanX: boolean;
	private lockScreenY?: number;
	private expDecayStrengthWheel: number;
	private expDecayStrengthTouch: number;
	private expDecayStrengthFract: number;

	private touches = new Map<number, Vector2>();
	private lastPinchDist = 0;

	private animating = false;
	private targetHeight: number;
	private userInputOverride = false;
	private lastInputType: "wheel" | "touch" | "fract" | null = null;

	private savedFract: number | null = null;

	constructor(camera: OrthographicCamera, domElement: HTMLElement, opts: Options = {}) {
		this.camera = camera;
		this.dom = domElement;

		this.minScale = opts.minScale ?? 0.65;
		this.maxScale = opts.maxScale ?? 2;
		this.wheelSpeed = opts.wheelSpeed ?? 0.002;
		this.pinchSpeed = opts.pinchSpeed ?? 0.005;
		this.enablePanX = opts.enablePanX ?? false;
		this.lockScreenY = opts.lockScreenY;
		this.expDecayStrengthWheel = opts.expDecayStrengthWheel ?? 3;
		this.expDecayStrengthTouch = opts.expDecayStrengthTouch ?? 16;
		this.expDecayStrengthFract = opts.expDecayStrengthFract ?? 2;

		this.targetHeight = camera.top - camera.bottom;

		this.bind();
	}

	saveState() {
		const height = this.targetHeight;
		const fract = (height - this.minScale) / (this.maxScale - this.minScale);
		this.savedFract = Math.max(0, Math.min(1, fract));
	}

	reset(opts: ZoomFractOptions = {}) {
		if (this.savedFract == null) return;
		this.zoomToFractInSetRange(this.savedFract, opts);
	}

	dispose() {
		this.dom.removeEventListener("wheel", this.onWheel);
		this.dom.removeEventListener("pointerdown", this.onPointerDown);
		this.dom.removeEventListener("pointermove", this.onPointerMove);
		this.dom.removeEventListener("pointerup", this.onPointerUp);
		this.dom.removeEventListener("pointercancel", this.onPointerUp);
		this.dom.removeEventListener("pointerleave", this.onPointerUp);
	}

	private zoomAt(clientX: number, clientY: number, scale: number) {
		const cam = this.camera;
		const rect = this.dom.getBoundingClientRect();
		const width = cam.right - cam.left;
		const height = cam.top - cam.bottom;

		const ndcX = ((clientX - rect.left) / rect.width) * 2 - 1;
		const ndcY = -((clientY - rect.top) / rect.height) * 2 + 1;
		const anchorY = this.lockScreenY !== undefined ? this.lockScreenY * 2 - 1 : ndcY;

		const worldX = cam.left + (ndcX + 1) * 0.5 * width;
		const worldY = cam.bottom + (anchorY + 1) * 0.5 * height;

		const newWidth = width * scale;
		const newHeight = height * scale;

		let newLeft = worldX - (ndcX + 1) * 0.5 * newWidth;
		let newBottom = worldY - (anchorY + 1) * 0.5 * newHeight;
		let newRight = newLeft + newWidth;
		let newTop = newBottom + newHeight;

		if (!this.enablePanX) {
			const cx = (cam.left + cam.right) * 0.5;
			newLeft = cx - newWidth * 0.5;
			newRight = cx + newWidth * 0.5;
		}

		cam.left = newLeft;
		cam.right = newRight;
		cam.top = newTop;
		cam.bottom = newBottom;
		cam.updateProjectionMatrix();
	}

	private onWheel = (e: WheelEvent) => {
		e.preventDefault();
		if (this.animating && !this.userInputOverride) return;

		const scale = Math.exp(e.deltaY * this.wheelSpeed);
		this.targetHeight = Math.max(
			this.minScale,
			Math.min(this.maxScale, (this.camera.top - this.camera.bottom) * scale)
		);
		this.lastInputType = "wheel";
	};

	private onPointerDown = (e: PointerEvent) => {
		if (this.animating && !this.userInputOverride) return;
		this.dom.setPointerCapture(e.pointerId);
		this.touches.set(e.pointerId, new Vector2(e.clientX, e.clientY));
		if (this.touches.size === 2) {
			const [a, b] = [...this.touches.values()];
			this.lastPinchDist = a.distanceTo(b);
		}
	};

	private onPointerMove = (e: PointerEvent) => {
		if (this.animating && !this.userInputOverride) return;
		if (!this.touches.has(e.pointerId)) return;
		this.touches.set(e.pointerId, new Vector2(e.clientX, e.clientY));

		if (this.touches.size === 2) {
			const [a, b] = [...this.touches.values()];
			const dist = a.distanceTo(b);
			if (this.lastPinchDist > 0) {
				const scale = Math.exp(-(dist - this.lastPinchDist) * this.pinchSpeed);
				this.targetHeight = Math.max(
					this.minScale,
					Math.min(
						this.maxScale,
						(this.camera.top - this.camera.bottom) * scale
					)
				);
				this.lastInputType = "touch";
			}
			this.lastPinchDist = dist;
		}
	};

	private onPointerUp = (e: PointerEvent) => {
		this.touches.delete(e.pointerId);
		if (this.touches.size < 2) this.lastPinchDist = 0;
	};

	private bind() {
		this.dom.addEventListener("wheel", this.onWheel, { passive: false });
		this.dom.addEventListener("pointerdown", this.onPointerDown);
		this.dom.addEventListener("pointermove", this.onPointerMove);
		this.dom.addEventListener("pointerup", this.onPointerUp);
		this.dom.addEventListener("pointercancel", this.onPointerUp);
		this.dom.addEventListener("pointerleave", this.onPointerUp);
	}

	zoomToFractInSetRange(fraction: number, opts: ZoomFractOptions = {}) {
		fraction = Math.max(0, Math.min(1, fraction));
		this.animating = true;
		this.userInputOverride = !opts.disableUserInput;
		this.targetHeight = this.minScale + (this.maxScale - this.minScale) * fraction;
		this.lastInputType = "fract";
	}

	update(dt: number) {
		const cam = this.camera;
		const height = cam.top - cam.bottom;

		if (this.animating || height !== this.targetHeight) {
			let decay = 16;
			if (this.lastInputType === "wheel") decay = this.expDecayStrengthWheel;
			else if (this.lastInputType === "touch") decay = this.expDecayStrengthTouch;
			else if (this.lastInputType === "fract") decay = this.expDecayStrengthFract;

			const newHeight = expDecay(height, this.targetHeight, decay, dt);
			const scale = newHeight / height;

			const rect = this.dom.getBoundingClientRect();
			const anchorX = rect.width / 2;
			const anchorY = rect.height * (this.lockScreenY ?? 0.5);

			this.zoomAt(anchorX, anchorY, scale);

			if (this.animating && Math.abs(newHeight - this.targetHeight) < 1e-3) {
				this.animating = false;
				this.userInputOverride = false;
				this.lastInputType = null;
			}
		}
	}
}
