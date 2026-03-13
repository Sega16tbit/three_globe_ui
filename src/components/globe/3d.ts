import {
	PerspectiveCamera,
	Scene,
	WebGLRenderer,
	Group,
	Box3,
	Vector3,
	Mesh,
	SphereGeometry,
	MeshBasicMaterial,
	Timer,
	Object3D,
	type Object3DEventMap,
	Raycaster,
	Vector2,
} from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GeoJSONLoader } from "@/lib/three-geojson";
import { WGS84_ELLIPSOID } from "3d-tiles-renderer";
import { WebGPURenderer } from "three/webgpu";

let camera: PerspectiveCamera,
	scene: Scene,
	renderer: WebGLRenderer | WebGPURenderer,
	controls: OrbitControls,
	clock: Timer,
	group: Object3D<Object3DEventMap>;

let globeBase: Mesh;

const countryMeshes = new Map<string, Mesh>();
const raycaster = new Raycaster();
const pointer = new Vector2();

init();

function init() {
	// camera
	camera = new PerspectiveCamera(
		70,
		window.innerWidth / window.innerHeight,
		0.01,
		1000
	);
	camera.position.x = -1;
	camera.position.y = 1.2;
	camera.position.z = 0;

	// scene
	scene = new Scene();

	// renderer
	renderer = new WebGPURenderer({ antialias: true });
	renderer.setAnimationLoop(animate);
	document.body.appendChild(renderer.domElement);

	renderer.domElement.addEventListener("click", onClick);

	// controls
	clock = new Timer();
	controls = new OrbitControls(camera, renderer.domElement);
	controls.minDistance = 1;
	controls.enableDamping = true;

	// construct geo group
	group = new Group();
	group.rotation.x = -Math.PI / 2;
	scene.add(group);

	// load geojson
	const url = new URL("/world.geojson", import.meta.url);
	new GeoJSONLoader().loadAsync(url).then((res: { polygons: any[] }) => {
		let thickness = 1e4;
		let resolution = 2.5;
		let wireframe = false;

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
		globeBase.scale.copy(WGS84_ELLIPSOID.radius);
		globeBase.renderOrder = 1;
		group.add(globeBase);

		const wireframeGroup = new Group();
		wireframeGroup.visible = wireframe;
		group.add(wireframeGroup);

		console.log(res);

		// load the globe lines
		res.polygons.forEach((geom) => {
			const feature = geom.feature;

			if (feature) {
				const iso = feature.properties.iso_a3;

				const meshForSelection = geom.getMeshObject({
					ellipsoid: WGS84_ELLIPSOID,
					thickness,
					resolution,
				});

				meshForSelection.name = iso;

				meshForSelection.material = new MeshBasicMaterial({
					opacity: 0,
					polygonOffset: true,
					polygonOffsetFactor: 1,
					polygonOffsetUnits: 1,
					transparent: true,
				});

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

		const pushState = history.pushState;

		history.pushState = function (...args) {
			pushState.apply(history, args);
			window.dispatchEvent(new Event("routechange"));
		};

		window.addEventListener("popstate", () => {
			window.dispatchEvent(new Event("routechange"));
		});

		window.addEventListener("routechange", handleRouteChange);

		handleRouteChange();

		// scale and center the model
		const box = new Box3();
		box.setFromObject(group);
		box.getCenter(group.position).multiplyScalar(-1);

		const size = new Vector3();
		box.getSize(size);
		group.scale.setScalar(1.5 / Math.max(...size));
		group.position.multiplyScalar(group.scale.x);

		console.log("response:", res);
	});
}

// animation
function animate() {
	controls.update(Math.min(clock.getDelta(), 64 / 1000));
	renderer.render(scene, camera);

	group.rotation.z = window.performance.now() * 1e-4;
}

// // respond to size changes:
function onResize() {
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.setPixelRatio(window.devicePixelRatio);

	camera.aspect = window.innerWidth / window.innerHeight;
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
	handleRouteChange();
}

function handleRouteChange() {
	const iso = location.pathname.replace("/", "");
	// reset all
	countryMeshes.forEach((mesh) => {
		(mesh.material as MeshBasicMaterial).opacity = 0;
	});

	if (iso === "") return;
	const mesh = countryMeshes.get(iso);
	if (mesh) {
		(mesh.material as MeshBasicMaterial).opacity = 1;
	}
}

export function mount(container: HTMLDivElement | null) {
	if (container) {
		container.insertBefore(renderer.domElement, container.firstChild);
		onResize();
	} else {
		renderer.domElement.remove();
	}
}
