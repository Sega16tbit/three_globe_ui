import { Object3D, Vector2, Vector3, Quaternion, Camera, MathUtils } from "three";

type Options = {
	enabled?: boolean;
	speed?: number;
	damping?: number;
	onDragStart?: () => void;
	onDragEnd?: (moved: boolean) => void;
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

	private moved = false;

	private azimuth = 0;
	private polar = 0;

	private baseQuat = new Quaternion();
	private qYaw = new Quaternion();
	private qPitch = new Quaternion();

	private worldUp = new Vector3(0, 1, 0);
	private camRight = new Vector3();

	private onDragStart?: () => void;
	private onDragEnd?: (moved: boolean) => void;

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

		this.onDragStart = options.onDragStart;
		this.onDragEnd = options.onDragEnd;

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
		this.moved = false;
		this.prevPointer.set(e.clientX, e.clientY);
		this.onDragStart?.();
	};

	private onMove = (e: PointerEvent) => {
		if (!this.enabled || !this.isDragging) return;

		this.pointer.set(e.clientX, e.clientY);

		const dx = (this.pointer.x - this.prevPointer.x) * 0.005 * this.speed;
		const dy = (this.pointer.y - this.prevPointer.y) * 0.005 * this.speed;

		if (Math.abs(dx) > 1e-4 || Math.abs(dy) > 1e-4) {
			this.moved = true;
		}

		this.velocity.set(dx, dy);
		this.prevPointer.copy(this.pointer);
	};

	private onUp = () => {
		if (!this.enabled) return;
		if (this.isDragging) {
			this.onDragEnd?.(this.moved);
		}
		this.isDragging = false;
	};

	update() {
		if (!this.enabled) return;

		this.azimuth += this.velocity.x;
		this.polar += this.velocity.y;

		this.polar = MathUtils.clamp(this.polar, -Math.PI / 2, Math.PI / 2 - Math.PI / 4);

		this.camRight.setFromMatrixColumn(this.camera.matrixWorld, 0).normalize();

		this.qYaw.setFromAxisAngle(this.worldUp, this.azimuth);
		this.qPitch.setFromAxisAngle(this.camRight, this.polar);

		this.object.quaternion.copy(this.baseQuat);
		this.object.quaternion.premultiply(this.qYaw);
		this.object.quaternion.premultiply(this.qPitch);

		this.velocity.lerp(new Vector2(0, 0), this.damping);
	}

	setEnabled(v: boolean) {
		this.enabled = v;
		this.isDragging = false;
	}

	dispose() {
		this.domElement.removeEventListener("pointerdown", this.onDown);
		window.removeEventListener("pointermove", this.onMove);
		window.removeEventListener("pointerup", this.onUp);
	}
}
