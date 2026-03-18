import { GeoJSONLoader } from "@/lib/three-geojson";
import { WGS84_ELLIPSOID } from "3d-tiles-renderer";
import {
	Box3,
	Group,
	Matrix4,
	Mesh,
	MeshBasicMaterial,
	ShaderMaterial,
	SphereGeometry,
	TextureLoader,
	Vector2,
	Vector3,
	type Object3DEventMap,
} from "three";
import * as GLSL from "../glsl/index.ts";

export class Globe extends Group {
	iso2CountryMeshesMap: Map<string, Mesh>;
	baseMesh: Mesh<SphereGeometry, ShaderMaterial, Object3DEventMap>;

	#lightPosition = new Vector3(-2, 1.5, 1);

	public rotateMode: "self" | "light" = "self";
	public rotate = true;
	public rotationSpeed = 0.05;
	public slowTransition = true;

	private _rotationSpeed = 0;

	#isReady = false;
	#readyCallbacks: Array<() => void> = [];

	private expDecay(current: number, target: number, dt: number, decay = 8) {
		return target + (current - target) * Math.exp(-decay * dt);
	}

	constructor() {
		super();

		this.rotation.x = -Math.PI / 2;

		this.iso2CountryMeshesMap = new Map();
		this.baseMesh = this.#constructBaseMesh();

		const url = new URL("/world.geojson", import.meta.url);

		new GeoJSONLoader().loadAsync(url).then((res: { polygons: any[] }) => {
			this.#constructCountriesMesh(res);
			this.#isReady = true;

			this.#readyCallbacks.forEach((cb) => cb());
			this.#readyCallbacks.length = 0;
		});
	}

	onReady(cb: (globe: this) => void) {
		if (this.#isReady) cb(this);
		else this.#readyCallbacks.push(() => cb(this));
	}

	#constructBaseMesh() {
		const texColor = new TextureLoader().load(
			"/HYP_50M_SR_W_DS.jpg",
			(t) => (t.needsUpdate = true)
		);

		const texHeight = new TextureLoader().load(
			"/gebco_08_rev_elev_5400x2700.jpg",
			(t) => (t.needsUpdate = true)
		);

		const material = new ShaderMaterial({
			uniforms: {
				u_time: { value: 1.0 },
				u_resolution: { value: new Vector2() },
				u_mouse: { value: new Vector2() },
				u_heightTex: { value: texHeight },
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
				u_lightPos: { value: this.#lightPosition.clone() },
			},
			vertexShader: GLSL.vertex,
			fragmentShader: GLSL.fragment,
		});

		const mesh = new Mesh(new SphereGeometry(1, 100, 50), material);

		mesh.scale.copy(WGS84_ELLIPSOID.radius);
		mesh.renderOrder = 1;

		this.add(mesh);

		material.uniforms.u_modelMatrix.value = mesh.matrixWorld;
		material.uniforms.u_inverseModelMatrix.value = mesh.matrixWorld.clone().invert();

		return mesh;
	}

	#constructCountriesMesh(res: { polygons: any[] }) {
		const thickness = 1e5 * 0.4;
		const resolution = 2.5;

		res.polygons.forEach((geom) => {
			const feature = geom.feature;

			if (feature) {
				const iso = feature.properties.iso_a3;
				const lat = feature.properties.label_y;
				const lon = feature.properties.label_x;

				const mesh = geom.getMeshObject({
					ellipsoid: WGS84_ELLIPSOID,
					thickness,
					resolution,
				});

				mesh.name = iso;
				mesh.userData.latLon = { lat, lon };

				mesh.material = new MeshBasicMaterial({
					opacity: 0,
					transparent: true,
					polygonOffset: true,
					polygonOffsetFactor: 1,
					polygonOffsetUnits: 1,
				});

				mesh.geometry.setAttribute("uv", this.baseMesh.geometry.attributes.uv);

				this.add(mesh);
				this.iso2CountryMeshesMap.set(iso, mesh);
			}

			const line = geom.getLineObject({
				ellipsoid: WGS84_ELLIPSOID,
				resolution,
			});

			line.material = new MeshBasicMaterial({
				opacity: 0.3,
				transparent: true,
				polygonOffset: true,
				polygonOffsetFactor: 1,
				polygonOffsetUnits: 1,
			});

			this.add(line);
		});

		const box = new Box3().setFromObject(this);
		const size = new Vector3();

		box.getCenter(this.position).multiplyScalar(-1);
		box.getSize(size);

		this.scale.setScalar(1.5 / Math.max(...size.toArray()));
		this.position.multiplyScalar(this.scale.x);
	}

	public update(dt: number) {
		const targetSpeed = this.rotate ? this.rotationSpeed : 0;

		this._rotationSpeed = this.slowTransition
			? this.expDecay(this._rotationSpeed, targetSpeed, dt)
			: targetSpeed;

		const delta = this._rotationSpeed * dt;

		if (this.rotateMode === "self") {
			this.rotation.z += delta;
		} else {
			const angle = delta * 3;
			const cos = Math.cos(angle);
			const sin = Math.sin(angle);

			const { x, z } = this.#lightPosition;

			this.#lightPosition.x = x * cos - z * sin;
			this.#lightPosition.z = x * sin + z * cos;
		}

		this.baseMesh.material.uniforms.u_lightPos.value.copy(this.#lightPosition);
	}
}
