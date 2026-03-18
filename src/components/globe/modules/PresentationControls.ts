import { Object3D, Vector2, Vector3, Quaternion, Camera, MathUtils } from "three";

type Options = {
	enabled?: boolean;
	speed?: number;
	damping?: number;
};

export class PresentationControls {
	private object: Object3D;
	private camera: Camera;
	private domElement: HTMLElement;

	private enabled: boolean;
	private speed: number;
	private damping: number;

	private isDragging = false;

	private pointer = new Vector2();
	private prevPointer = new Vector2();
	private velocity = new Vector2();

	// spherical state
	private azimuth = 0; // infinite
	private polar = 0; // clamped [-PI/2, PI/2]

	private baseQuat = new Quaternion();
	private qYaw = new Quaternion();
	private qPitch = new Quaternion();

	private worldUp = new Vector3(0, 1, 0);
	private camRight = new Vector3();

	constructor(
		object: Object3D,
		camera: Camera,
		domElement: HTMLElement,
		options: Options = {}
	) {
		this.object = object;
		this.camera = camera;
		this.domElement = domElement;

		this.enabled = options.enabled ?? true;
		this.speed = options.speed ?? 1;
		this.damping = options.damping ?? 0.1;

		this.baseQuat.copy(object.quaternion);

		this.bind();
	}

	private bind() {
		this.domElement.addEventListener("pointerdown", this.onDown);
		window.addEventListener("pointermove", this.onMove);
		window.addEventListener("pointerup", this.onUp);
	}

	private onDown = (e: PointerEvent) => {
		if (!this.enabled) return;
		this.isDragging = true;
		this.prevPointer.set(e.clientX, e.clientY);
	};

	private onMove = (e: PointerEvent) => {
		if (!this.enabled || !this.isDragging) return;

		this.pointer.set(e.clientX, e.clientY);

		const dx = (this.pointer.x - this.prevPointer.x) * 0.005 * this.speed;
		const dy = (this.pointer.y - this.prevPointer.y) * 0.005 * this.speed;

		this.velocity.set(dx, dy);

		this.prevPointer.copy(this.pointer);
	};

	private onUp = () => {
		this.isDragging = false;
	};

	update() {
		if (!this.enabled) return;

		// accumulate spherical angles
		this.azimuth += this.velocity.x;
		this.polar += this.velocity.y;

		// clamp polar to 180° total range
		this.polar = MathUtils.clamp(this.polar, -Math.PI / 2, Math.PI / 2 - Math.PI / 4);

		// camera right axis (world space)
		this.camRight.setFromMatrixColumn(this.camera.matrixWorld, 0).normalize();

		// build quaternions (WORLD axes)
		this.qYaw.setFromAxisAngle(this.worldUp, this.azimuth);
		this.qPitch.setFromAxisAngle(this.camRight, this.polar);

		// compose: yaw (world up) then pitch (camera right)
		this.object.quaternion.copy(this.baseQuat);
		this.object.quaternion.premultiply(this.qYaw);
		this.object.quaternion.premultiply(this.qPitch);

		// damping
		this.velocity.lerp(new Vector2(0, 0), this.damping);
	}

	dispose() {
		this.domElement.removeEventListener("pointerdown", this.onDown);
		window.removeEventListener("pointermove", this.onMove);
		window.removeEventListener("pointerup", this.onUp);
	}
}
