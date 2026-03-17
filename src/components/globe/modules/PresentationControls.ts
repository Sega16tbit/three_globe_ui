import { Object3D, Vector2, Vector3, Quaternion, MathUtils } from "three";

const _meshToGlobeDir = new Vector3();
const _targetDir = new Vector3();
const _rotQuat = new Quaternion();

type Options = {
	enabled?: boolean;
	speed?: number;
	damping?: number;
};

export class PresentationControls {
	private object: Object3D;
	// private camera: Camera;
	private domElement: HTMLElement;

	private enabled: boolean;
	private speed: number;
	private damping: number;

	private isDragging = false;
	private pointer = new Vector2();
	private prevPointer = new Vector2();
	private velocity = new Vector2();

	private azimuth = 0;
	private polar = 0;

	private baseQuat = new Quaternion();
	private qYaw = new Quaternion();
	private qPitch = new Quaternion();

	private worldUp = new Vector3(0, 1, 0);
	private polarAxis = new Vector3();

	private lookAtTargetQuat = new Quaternion();
	private isFitting = false;
	private prevQuat = new Quaternion();

	constructor(
		object: Object3D,
		// camera: Camera,
		domElement: HTMLElement,
		options: Options = {}
	) {
		this.object = object;
		// this.camera = camera;
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

		// Corrected: pointer Y movement maps directly to polar
		this.velocity.set(dx, -dy);

		this.prevPointer.copy(this.pointer);
	};

	private onUp = () => {
		this.isDragging = false;
	};

	public facePoint(worldPoint: Vector3, boundingSphere: { center: Vector3 }) {
		_targetDir.copy(worldPoint).normalize();
		_meshToGlobeDir.copy(boundingSphere.center).normalize();
		_rotQuat.setFromUnitVectors(_meshToGlobeDir, _targetDir);

		this.prevQuat.copy(this.object.quaternion);
		this.lookAtTargetQuat.copy(this.object.quaternion).premultiply(_rotQuat);
		this.isFitting = true;
	}

	public revertFaceBack() {
		this.lookAtTargetQuat.copy(this.prevQuat);
		this.isFitting = true;
	}

	public update(dt: number) {
		if (!this.enabled) return;

		if (this.isFitting) {
			this.object.quaternion.x = expDecay(
				this.object.quaternion.x,
				this.lookAtTargetQuat.x,
				5,
				dt
			);
			this.object.quaternion.y = expDecay(
				this.object.quaternion.y,
				this.lookAtTargetQuat.y,
				5,
				dt
			);
			this.object.quaternion.z = expDecay(
				this.object.quaternion.z,
				this.lookAtTargetQuat.z,
				5,
				dt
			);
			this.object.quaternion.w = expDecay(
				this.object.quaternion.w,
				this.lookAtTargetQuat.w,
				5,
				dt
			);

			if (this.object.quaternion.angleTo(this.lookAtTargetQuat) < 0.001) {
				this.object.quaternion.copy(this.lookAtTargetQuat);
				this.isFitting = false;

				this.baseQuat.copy(this.object.quaternion);
				this.azimuth = 0;
				this.polar = 0;
				this.velocity.set(0, 0);
			}

			return;
		}

		// accumulate pointer input
		this.azimuth += this.velocity.x;
		this.polar += this.velocity.y;
		this.polar = MathUtils.clamp(this.polar, -Math.PI / 2, Math.PI / 2);

		// yaw around world up
		this.qYaw.setFromAxisAngle(this.worldUp, this.azimuth);

		// polar axis is always horizontal relative to globe
		this.polarAxis.set(1, 0, 0).applyQuaternion(this.qYaw).normalize();
		this.qPitch.setFromAxisAngle(this.polarAxis, this.polar);

		this.object.quaternion.copy(this.baseQuat);
		this.object.quaternion.premultiply(this.qYaw);
		this.object.quaternion.premultiply(this.qPitch);

		// damping
		this.velocity.lerp(new Vector2(0, 0), this.damping);
	}
}

function expDecay(a: number, b: number, decay = 16, dt: number) {
	return b + (a - b) * Math.exp(-decay * dt);
}
