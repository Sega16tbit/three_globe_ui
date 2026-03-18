import {
	Scene,
	WebGLRenderer,
	Box3,
	Vector2,
	Vector3,
	Mesh,
	Clock,
	Raycaster,
	OrthographicCamera,
	Sphere,
	ShaderMaterial,
	Material,
	Group,
	MeshBasicMaterial,
	PlaneGeometry,
	DoubleSide,
} from "three";
import * as THREE from "three";
import CameraControls from "camera-controls";
import { PresentationControls } from "./modules/PresentationControls.ts";
import { OrthoZoomControls } from "./modules/OrthoZoomControls.ts";
import { Globe } from "./modules/Globe.ts";

CameraControls.install({ THREE });

// Debug meshes (unused but kept intact)
const rect1 = new Mesh(
	new PlaneGeometry(2, 1),
	new MeshBasicMaterial({
		color: 0xff0000,
		transparent: true,
		opacity: 0.3,
		side: DoubleSide,
	})
);
const rect2 = new Mesh(
	new PlaneGeometry(2, 1),
	new MeshBasicMaterial({
		color: 0x00ff00,
		transparent: true,
		opacity: 0.3,
		side: DoubleSide,
	})
);
const rect3 = new Mesh(
	new PlaneGeometry(2, 1),
	new MeshBasicMaterial({
		color: 0x0000ff,
		transparent: true,
		opacity: 0.3,
		side: DoubleSide,
	})
);

// Core
let scene: Scene;
let camera: OrthographicCamera;
let renderer: WebGLRenderer;
let clock: Clock;

let cameraControls: CameraControls;
let presentationControls: PresentationControls;
let orthoZoomControls: OrthoZoomControls;

let rendererSize: Vector2;
let globe: Globe;

// Interaction
let hoveredMesh: Mesh | null = null;
const raycaster = new Raycaster();
const pointer = new Vector2();

// State
let hasSavedState = false;

init();

function init() {
	camera = new OrthographicCamera();
	camera.position.set(-1, 0.5, 0);
	camera.lookAt(0, 0, 0);

	scene = new Scene();

	renderer = new WebGLRenderer({ antialias: true });
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.setAnimationLoop(animate);
	document.body.appendChild(renderer.domElement);

	renderer.domElement.addEventListener("click", onClick);
	renderer.domElement.addEventListener("mousemove", onHover);

	rendererSize = renderer.getDrawingBufferSize(new Vector2());
	clock = new Clock();

	globe = new Globe();
	globe.onReady(configureRouting);

	const pivot = new Group();
	pivot.add(globe);
	scene.add(pivot);

	presentationControls = new PresentationControls(pivot, camera, renderer.domElement, {
		speed: 1.2,
		damping: 0.08,
	});

	orthoZoomControls = new OrthoZoomControls(camera, renderer.domElement, {
		wheelSpeed: 0.0015,
		pinchSpeed: 0.004,
		lockScreenY: 0.872,
		expDecayStrengthWheel: 3,
		expDecayStrengthTouch: 16,
		expDecayStrengthFract: 2,
	});

	setupCameraControls();
}

function setupCameraControls() {
	cameraControls = new CameraControls(camera, renderer.domElement);
	cameraControls.enabled = true;

	cameraControls.mouseButtons.left = CameraControls.ACTION.NONE;
	cameraControls.mouseButtons.right = CameraControls.ACTION.NONE;
	cameraControls.mouseButtons.wheel = CameraControls.ACTION.NONE;

	cameraControls.touches.one = CameraControls.ACTION.NONE;
	cameraControls.touches.two = CameraControls.ACTION.NONE;
	cameraControls.touches.three = CameraControls.ACTION.NONE;

	cameraControls.polarRotateSpeed = 0.5;
	cameraControls.azimuthRotateSpeed = 0.5;
	cameraControls.maxPolarAngle = Infinity;
}

function configureRouting() {
	const pushState = history.pushState;

	history.pushState = function (...args) {
		pushState.apply(history, args);
		window.dispatchEvent(new Event("routechange"));
	};

	window.addEventListener("popstate", () =>
		window.dispatchEvent(new Event("routechange"))
	);

	window.addEventListener("routechange", handleRouteChange);
	handleRouteChange();
}

function animate() {
	const delta = clock.getDelta();
	const elapsed = clock.getElapsedTime();

	cameraControls.update(delta);
	presentationControls.update();
	orthoZoomControls.update(delta);
	globe.update(delta);

	const uniforms = globe.baseMesh.material.uniforms;
	uniforms.u_time.value = elapsed;
	uniforms.u_cameraWorldMatrix.value.copy(camera.matrixWorld);
	uniforms.u_cameraProjectionMatrixInverse.value.copy(camera.projectionMatrixInverse);
	uniforms.u_cameraZoom.value = camera.zoom;
	uniforms.u_orthoHalfHeight.value = ((camera.top - camera.bottom) * 0.5) / camera.zoom;
	uniforms.u_orthoHalfWidth.value = ((camera.right - camera.left) * 0.5) / camera.zoom;
	uniforms.u_modelMatrix.value.copy(globe.baseMesh.matrixWorld);
	uniforms.u_inverseModelMatrix.value.copy(globe.baseMesh.matrixWorld).invert();

	renderer.render(scene, camera);
}

function onResize() {
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.setPixelRatio(window.devicePixelRatio);

	const aspect = window.innerWidth / window.innerHeight;
	camera.left = -aspect;
	camera.right = aspect;
	camera.updateProjectionMatrix();

	rendererSize = renderer.getDrawingBufferSize(new Vector2());

	if (globe.baseMesh && globe.baseMesh.material instanceof ShaderMaterial) {
		globe.baseMesh.material.uniforms.u_resolution.value = rendererSize;
	}
}

window.addEventListener("resize", onResize);
onResize();

function updatePointer(event: MouseEvent) {
	const rect = renderer.domElement.getBoundingClientRect();
	pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
	pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
}

function onHover(event: MouseEvent) {
	updatePointer(event);
	raycaster.setFromCamera(pointer, camera);

	let nextMesh: Mesh | null = null;

	const globeHit = globe.baseMesh
		? raycaster.intersectObject(globe.baseMesh, false)
		: [];

	if (globeHit.length) {
		const countryHits = raycaster.intersectObjects(
			Array.from(globe.iso2CountryMeshesMap.values()),
			false
		);

		if (countryHits.length && countryHits[0].distance <= globeHit[0].distance) {
			nextMesh = countryHits[0].object as Mesh;
		}
	}

	if (hoveredMesh === nextMesh) return;

	if (hoveredMesh) (hoveredMesh.material as any).opacity = 0.0;
	if (nextMesh) (nextMesh.material as any).opacity = 0.4;

	hoveredMesh = nextMesh;
}

function onClick(event: MouseEvent) {
	updatePointer(event);
	raycaster.setFromCamera(pointer, camera);

	const globeHit = globe.baseMesh ? raycaster.intersectObject(globe.baseMesh) : [];

	if (!globeHit.length) return;

	const countryHits = raycaster.intersectObjects(
		Array.from(globe.iso2CountryMeshesMap.values())
	);

	if (!countryHits.length || countryHits[0].distance > globeHit[0].distance) return;

	const mesh = countryHits[0].object as Mesh;
	history.pushState({}, "", "/" + mesh.name);
}

function handleRouteChange() {
	const iso = location.pathname.replace("/", "");

	// RESET MODE
	if (!iso) {
		globe.iso2CountryMeshesMap.forEach(
			(mesh) => ((mesh.material as Material).opacity = 0)
		);

		cameraControls.stop();

		if (hasSavedState) {
			cameraControls.reset(true);
			hasSavedState = false;
		}

		orthoZoomControls.reset();
		globe.rotateMode = "self";

		return;
	}

	// FOCUS MODE
	const mesh = globe.iso2CountryMeshesMap.get(iso);
	if (!mesh) return;

	(mesh.material as Material).opacity = 1;

	if (!hasSavedState) {
		cameraControls.saveState();
		hasSavedState = true;
	}

	cameraControls.stop();

	const boundingSphere = new Sphere();
	new Box3().setFromObject(mesh).getBoundingSphere(boundingSphere);

	const dir = new Vector3().copy(boundingSphere.center).normalize();
	const up = new Vector3(0, 1, 0);

	const axis = new Vector3().crossVectors(dir, up).normalize();
	if (axis.lengthSq() === 0) axis.set(1, 0, 0);

	const polarOffset = THREE.MathUtils.degToRad(-45);
	dir.applyAxisAngle(axis, polarOffset);

	const azimuth = Math.atan2(dir.x, dir.z);
	const polar = Math.acos(THREE.MathUtils.clamp(dir.y, -1, 1));

	cameraControls.rotateTo(azimuth, polar, true);

	const zoomTarget = Math.max(0.0, boundingSphere.radius);
	orthoZoomControls.saveState();
	orthoZoomControls.zoomToFractInSetRange(zoomTarget, {
		disableUserInput: true,
	});

	globe.rotateMode = "light";
}

export function mount(container: HTMLDivElement | null) {
	if (container) {
		container.insertBefore(renderer.domElement, container.firstChild);
		onResize();
	} else {
		renderer.domElement.remove();
	}
}
