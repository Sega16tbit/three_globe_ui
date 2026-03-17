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
} from "three";
import * as THREE from "three";
import CameraControls from "camera-controls";
import { PresentationControls } from "./modules/PresentationControls.ts";
import { OrthoZoomControls } from "./modules/OrthoZoomControls.ts";
import { Globe } from "./modules/Globe.ts";

CameraControls.install({ THREE });

// const POLAR_ROTATE_SPEED = 0.5;
// const AZIMUTH_ROTATE_SPEED = 0.5;
// const TOUCH_SPEED = 6;
// const NON_TOUCH_SPEED = 1;

let scene: Scene,
	camera: OrthographicCamera,
	renderer: WebGLRenderer,
	clock: Clock,
	presentationControls: PresentationControls,
	orthoZoomController: OrthoZoomControls,
	rendererSize: Vector2,
	globe: Globe;

let hoveredMesh: Mesh | null = null;
const raycaster = new Raycaster();
const pointer = new Vector2();

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
	globe.onReady(() => configureRouting());

	const pivot = new Group();
	pivot.add(globe);

	presentationControls = new PresentationControls(pivot, renderer.domElement, {
		speed: 1.2,
		damping: 0.08,
	});
	scene.add(pivot);

	orthoZoomController = new OrthoZoomControls(camera, renderer.domElement, {
		wheelSpeed: 0.0015,
		pinchSpeed: 0.004,
		lockScreenY: 0.872,
		expDecayStrengthWheel: 3,
		expDecayStrengthTouch: 16,
		expDecayStrengthFract: 2,
	});
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

// function shortestAzimuth(target: number, current: number) {
// 	let delta = target - current;
// 	return current + ((delta + Math.PI) % (Math.PI * 2)) - Math.PI;
// }

function animate() {
	const delta = clock.getDelta();
	const elapsed = clock.getElapsedTime();

	presentationControls.update(delta);
	orthoZoomController.update(delta);

	if (globe.baseMesh && globe.baseMesh.material instanceof ShaderMaterial) {
		const mat = globe.baseMesh.material.uniforms;
		mat.u_time.value = elapsed;
		mat.u_cameraWorldMatrix.value.copy(camera.matrixWorld);
		mat.u_cameraProjectionMatrixInverse.value.copy(camera.projectionMatrixInverse);
		mat.u_cameraZoom.value = camera.zoom;
		mat.u_orthoHalfHeight.value = ((camera.top - camera.bottom) * 0.5) / camera.zoom;
		mat.u_orthoHalfWidth.value = ((camera.right - camera.left) * 0.5) / camera.zoom;
		mat.u_modelMatrix.value.copy(globe.baseMesh.matrixWorld);
		mat.u_inverseModelMatrix.value.copy(globe.baseMesh.matrixWorld.clone().invert());
	}

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
onResize();
window.addEventListener("resize", onResize);

function onHover(event: MouseEvent) {
	const rect = renderer.domElement.getBoundingClientRect();
	pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
	pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

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
	const rect = renderer.domElement.getBoundingClientRect();
	pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
	pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
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
	if (!iso) {
		globe.iso2CountryMeshesMap.forEach(
			(mesh) => ((mesh.material as Material).opacity = 0)
		);

		orthoZoomController.zoomToFractInSetRange(1.0, {
			disableUserInput: false,
		});

		presentationControls.revertFaceBack();
		return;
	}

	const mesh = globe.iso2CountryMeshesMap.get(iso);
	if (mesh) {
		(mesh.material as Material).opacity = 1;

		const boundingSphere = new Sphere();
		new Box3().setFromObject(mesh).getBoundingSphere(boundingSphere);

		orthoZoomController.zoomToFractInSetRange(0.0, {
			disableUserInput: true,
		});

		presentationControls.facePoint(new Vector3(0, 1, 0), boundingSphere);
	}
}

export function mount(container: HTMLDivElement | null) {
	if (container) {
		container.insertBefore(renderer.domElement, container.firstChild);
		onResize();
	} else renderer.domElement.remove();
}
