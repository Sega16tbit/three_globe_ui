import {
	Scene,
	WebGLRenderer,
	Group,
	Box3,
	Vector3,
	Mesh,
	SphereGeometry,
	MeshBasicMaterial,
	Clock,
	Object3D,
	Raycaster,
	Vector2,
	OrthographicCamera,
	type Object3DEventMap,
	Sphere,
	PlaneGeometry,
	MathUtils,
	Matrix4,
	ShaderMaterial,
	TextureLoader,
	DoubleSide,
} from "three";
import * as THREE from "three";
import * as GLSL from "./glsl/index.ts";
import CameraControls from "camera-controls";
import { GeoJSONLoader } from "@/lib/three-geojson";
import { WGS84_ELLIPSOID } from "3d-tiles-renderer";
// import { VertexNormalsHelper } from "three/addons/helpers/VertexNormalsHelper.js";

CameraControls.install({ THREE });

const POLAR_ROTATE_SPEED = 0.5;
const AZIMUTH_ROTATE_SPEED = 0.5;
const TOUCH_SPEED = 6;
const NON_TOUCH_SPEED = 1;

let scene: Scene,
	camera: OrthographicCamera,
	renderer: WebGLRenderer,
	clock: Clock,
	group: Object3D<Object3DEventMap>,
	cameraControls: CameraControls,
	globeBase: Mesh,
	shaderMaterial: ShaderMaterial,
	rendererSize: Vector2;

const countryMeshes = new Map<string, Mesh>();
const raycaster = new Raycaster();
const pointer = new Vector2();

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
// const rectHelper = new VertexNormalsHelper(rect1, 0.5);

init();

function init() {
	// camera
	// camera = new PerspectiveCamera(
	// 	70,
	// 	window.innerWidth / window.innerHeight,
	// 	0.01,
	// 	1000
	// );
	camera = new OrthographicCamera();
	camera.position.x = -1;
	camera.position.y = 0.5;
	camera.position.z = 0;

	// scene
	scene = new Scene();

	// renderer
	// renderer = new WebGPURenderer({ antialias: true });
	renderer = new WebGLRenderer({ antialias: true });
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.setAnimationLoop(animate);
	document.body.appendChild(renderer.domElement);
	renderer.domElement.addEventListener("click", onClick);
	rendererSize = renderer.getDrawingBufferSize(new Vector2());

	// time
	clock = new Clock();

	// camera controls
	cameraControls = new CameraControls(camera, renderer.domElement);
	cameraControls.enabled = true;
	cameraControls.minZoom = 1;
	cameraControls.maxZoom = 6;
	cameraControls.mouseButtons.right = CameraControls.ACTION.NONE; // disable truck
	cameraControls.touches.two = CameraControls.ACTION.TOUCH_ZOOM; // disable truck
	cameraControls.touches.three = CameraControls.ACTION.NONE;
	cameraControls.polarRotateSpeed = POLAR_ROTATE_SPEED;
	cameraControls.azimuthRotateSpeed = AZIMUTH_ROTATE_SPEED;
	cameraControls.addEventListener("controlend", () => {
		cameraControls.polarRotateSpeed = POLAR_ROTATE_SPEED / camera.zoom;
		cameraControls.azimuthRotateSpeed = AZIMUTH_ROTATE_SPEED / camera.zoom;
	});
	renderer.domElement.addEventListener("touchstart", () => {
		cameraControls.dollySpeed = TOUCH_SPEED;
	});
	renderer.domElement.addEventListener("touchend", () => {
		cameraControls.dollySpeed = NON_TOUCH_SPEED;
	});

	// shader
	// const texColor = new TextureLoader().load("/NE2_50M_SR.jpg");
	const texColor = new TextureLoader().load("/HYP_50M_SR_W_DS.jpg");
	const texHight = new TextureLoader().load("/gebco_08_rev_elev_5400x2700.jpg");

	shaderMaterial = new ShaderMaterial({
		uniforms: {
			u_time: { value: 1.0 },
			u_resolution: { value: rendererSize },
			u_mouse: { value: new Vector2() },
			u_heightTex: { value: texHight },
			u_colorTex: { value: texColor },
			u_radius: { value: 1 },
			u_dispStrength: { value: 0.01 },
			u_cameraZoom: { value: 1.0 },
			u_modelMatrix: { value: new Matrix4() },
			u_inverseModelMatrix: { value: new Matrix4() },
			u_cameraWorldMatrix: { value: new Matrix4() },
			u_cameraProjectionMatrixInverse: { value: new Matrix4() },
			u_orthoHalfHeight: { value: 1 },
			u_orthoHalfWidth: { value: 1 },
		},
		vertexShader: GLSL.vertex,
		fragmentShader: GLSL.fragment,
	});

	// construct geo group
	group = new Group();
	group.rotation.x = -Math.PI / 2;
	scene.add(group);

	// load geojson
	const url = new URL("/world.geojson", import.meta.url);
	new GeoJSONLoader()
		.loadAsync(url)
		.then((res: { polygons: any[] }) => {
			const thickness = 1e5 * 0.4;
			const resolution = 2.5;
			const wireframe = false;

			globeBase = new Mesh(
				new SphereGeometry(1, 100, 50),
				new MeshBasicMaterial({
					color: 0x222222,
					depthWrite: true,
					// 		polygonOffset: true,
					// 		polygonOffsetFactor: 1,
					// 		polygonOffsetUnits: 1,
				})
			);
			globeBase.material = shaderMaterial;

			globeBase.scale.copy(WGS84_ELLIPSOID.radius);
			globeBase.renderOrder = 1;
			group.add(globeBase);

			shaderMaterial.uniforms.u_modelMatrix.value = globeBase.matrixWorld;
			shaderMaterial.uniforms.u_inverseModelMatrix.value = globeBase.matrixWorld
				.clone()
				.invert();

			const wireframeGroup = new Group();
			wireframeGroup.visible = wireframe;
			group.add(wireframeGroup);

			console.log(res);

			// load the globe lines
			res.polygons.forEach((geom) => {
				const feature = geom.feature;

				if (feature) {
					const iso = feature.properties.iso_a3;
					const lat = feature.properties.label_y;
					const lon = feature.properties.label_x;

					const meshForSelection = geom.getMeshObject({
						ellipsoid: WGS84_ELLIPSOID,
						thickness,
						resolution,
					});

					meshForSelection.name = iso;
					meshForSelection.userData.latLon = {
						lat,
						lon,
					};

					meshForSelection.material = new MeshBasicMaterial({
						// opacity: 0,
						polygonOffset: true,
						polygonOffsetFactor: 1,
						polygonOffsetUnits: 1,
						transparent: true,
					});
					meshForSelection.visible = false;
					meshForSelection.geometry.setAttribute(
						"uv",
						globeBase.geometry.attributes.uv
					);
					group.add(meshForSelection);
					countryMeshes.set(iso, meshForSelection);

					const wireframeMesh = meshForSelection.clone();
					wireframeMesh.material = new MeshBasicMaterial({
						color: 0,
						opacity: 0.15,
						// transparent: true,
						depthWrite: false,
						// wireframe: true,
					});
					wireframeGroup.add(wireframeMesh);
				}
				const line = geom.getLineObject({
					ellipsoid: WGS84_ELLIPSOID,
					resolution,
				});
				group.add(line);
			});

			// scale and center the model
			const box = new Box3();
			box.setFromObject(group);
			box.getCenter(group.position).multiplyScalar(-1);

			const size = new Vector3();
			box.getSize(size);
			group.scale.setScalar(1.5 / Math.max(...size));
			group.position.multiplyScalar(group.scale.x);

			console.log("response:", res);
		})
		.then(() => {
			const pushState = history.pushState;
			history.pushState = function (...args) {
				pushState.apply(history, args);
				window.dispatchEvent(new Event("routechange"));
			};
			window.addEventListener("popstate", () => {
				window.dispatchEvent(new Event("routechange"));
			});
			window.addEventListener("routechange", handleRouteChange);
			// setTimeout(() => handleRouteChange(), 2000);
			handleRouteChange();
		});
}

function shortestAzimuth(target: number, current: number) {
	let delta = target - current;
	delta = ((delta + Math.PI) % (Math.PI * 2)) - Math.PI;
	return current + delta;
}

function animate() {
	const delta = clock.getDelta();
	const elapsed = clock.getElapsedTime();
	cameraControls.update(delta);

	shaderMaterial.uniforms.u_time.value = elapsed;
	shaderMaterial.uniforms.u_cameraWorldMatrix.value.copy(camera.matrixWorld);
	shaderMaterial.uniforms.u_cameraProjectionMatrixInverse.value.copy(
		camera.projectionMatrixInverse
	);
	shaderMaterial.uniforms.u_cameraZoom.value = camera.zoom;
	shaderMaterial.uniforms.u_orthoHalfHeight.value =
		((camera.top - camera.bottom) * 0.5) / camera.zoom;
	shaderMaterial.uniforms.u_orthoHalfWidth.value =
		((camera.right - camera.left) * 0.5) / camera.zoom;

	if (globeBase) {
		globeBase.updateMatrixWorld();
		shaderMaterial.uniforms.u_modelMatrix.value.copy(globeBase.matrixWorld);
		shaderMaterial.uniforms.u_inverseModelMatrix.value.copy(
			globeBase.matrixWorld.clone().invert()
		);
	}

	group.rotation.z = window.performance.now() * 1e-4;

	renderer.render(scene, camera);
}

// // respond to size changes:
function onResize() {
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.setPixelRatio(window.devicePixelRatio);
	const aspect = window.innerWidth / window.innerHeight;
	// perspective
	// (camera as PerspectiveCamera).aspect = aspect;
	// orthographic
	(camera as OrthographicCamera).left = -aspect;
	(camera as OrthographicCamera).right = aspect;
	camera.updateProjectionMatrix();
}
onResize();
window.addEventListener("resize", onResize);

function onClick(event: MouseEvent) {
	const rect = renderer.domElement.getBoundingClientRect();
	pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
	pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
	raycaster.setFromCamera(pointer, camera);
	const globeHit = raycaster.intersectObject(globeBase);
	if (!globeHit.length) return;
	const countryHits = raycaster.intersectObjects(Array.from(countryMeshes.values()));
	if (!countryHits.length) return;
	// stop if country is behind the globe
	if (countryHits[0].distance > globeHit[0].distance) return;

	const mesh = countryHits[0].object as Mesh;
	const iso = mesh.name;

	history.pushState({}, "", "/" + iso);
}

function handleRouteChange() {
	const iso = location.pathname.replace("/", "");
	if (iso === "") {
		// reset all
		countryMeshes.forEach((mesh) => {
			mesh.visible = false;
		});
		cameraControls.setTarget(0, 0, 0, true);
		cameraControls.zoomTo(1, true);
		// scene.remove(
		// 	rect1,
		// 	rect2,
		// 	rect3
		// 	// rectHelper
		// );
		return;
	}

	const mesh = countryMeshes.get(iso);
	if (mesh) {
		mesh.visible = true;

		scene.updateMatrixWorld(true);

		// First position: Plane on ray from 0,0,0 to center of country mesh boundary sphere
		const boundingSphere = new Sphere();
		// compute bounding sphere from mesh (world space)
		new Box3().setFromObject(mesh).getBoundingSphere(boundingSphere);

		// const diameter = boundingSphere.radius * 2;

		rect1.geometry.dispose();
		rect2.geometry.dispose();
		rect3.geometry.dispose();

		// rect1.geometry = new PlaneGeometry(diameter, diameter);
		rect1.geometry = new PlaneGeometry(0.8, 0.8);

		//basic placement
		// rect1.position.copy(boundingSphere.center);
		// rect1.lookAt(0, 0, 0);

		// placement on a ray with distance
		rect1.position.copy(boundingSphere.center).normalize().multiplyScalar(1);

		// rect1.lookAt(boundingSphere.center);
		// rect1.lookAt(boundingSphere.center.normalize().multiplyScalar(0.7));
		rect1.lookAt(0, 0, 0);

		// Second position: latitude rotation to the vector
		rect2.position.copy(rect1.position);
		rect2.geometry.copy(rect1.geometry);
		const radius = 1;
		const latOffset = MathUtils.degToRad(-30); // latitude offset
		const pos = rect2.position
			.copy(boundingSphere.center)
			.normalize()
			.multiplyScalar(radius);
		// axis for latitude rotation
		const axis = new Vector3().crossVectors(pos, new Vector3(0, 1, 0)).normalize();
		pos.applyAxisAngle(axis, latOffset);

		// Third position: rect2.lookAt(boundingSphere.center);
		rect2.lookAt(0, 0, 0);
		// rotate rect.2 around 0,0,0 world center point by azimuth 20 deg
		rect3.position.copy(rect2.position);
		rect3.geometry.copy(rect2.geometry);
		rect3.rotation.copy(rect2.rotation);
		// rect3.rotateOnAxis(new Vector3(1, 0, 0), 0.4);
		// rect3.lookAt(boundingSphere.center.normalize().multiplyScalar(0.6));
		rect3.lookAt(boundingSphere.center.normalize().multiplyScalar(0.5));

		// scene.add(
		// 	rect1,
		// 	rect2,
		// 	rect3
		// 	//  rectHelper
		// );

		fitToRect(rect3);
	}
}

const _centerPosition = new Vector3();
const _normal = new Vector3();

const fitToRect = (rect: Mesh<PlaneGeometry, MeshBasicMaterial, Object3DEventMap>) => {
	const rectWidth = rect.geometry.parameters.width;
	const rectHeight = rect.geometry.parameters.height;

	rect.updateMatrixWorld();

	const rectCenterPosition = _centerPosition.copy(rect.position);

	const normal = _normal
		.set(0, 0, 1)
		.applyQuaternion(rect.quaternion)
		.normalize()
		.negate(); // camera must be opposite rect normal

	const zoomX = (camera.right - camera.left) / rectWidth;
	const zoomY = (camera.top - camera.bottom) / rectHeight;
	const zoom = Math.min(zoomX, zoomY);

	const azimuth = Math.atan2(normal.x, normal.z);
	const polar = Math.acos(MathUtils.clamp(normal.y, -1, 1));

	cameraControls.normalizeRotations();

	cameraControls.moveTo(
		rectCenterPosition.x,
		rectCenterPosition.y,
		rectCenterPosition.z,
		true
	);

	cameraControls.rotateTo(azimuth, polar, true);

	cameraControls.zoomTo(zoom, true);
};

export function mount(container: HTMLDivElement | null) {
	if (container) {
		container.insertBefore(renderer.domElement, container.firstChild);
		onResize();
	} else {
		renderer.domElement.remove();
	}
}
