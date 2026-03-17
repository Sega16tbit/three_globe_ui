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

	#constructBaseMesh = () => {
		const texColor = new TextureLoader().load("/HYP_50M_SR_W_DS.jpg");
		const texHight = new TextureLoader().load("/gebco_08_rev_elev_5400x2700.jpg");

		const baseMesh = new Mesh(
			new SphereGeometry(1, 100, 50),
			new ShaderMaterial({
				uniforms: {
					u_time: { value: 1.0 },
					u_resolution: { value: new Vector2() },
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
					u_lightPos: { value: new Vector3(-2, 1.5, 1) },
				},
				vertexShader: GLSL.vertex,
				fragmentShader: GLSL.fragment,
			})
		);

		baseMesh.scale.copy(WGS84_ELLIPSOID.radius);
		baseMesh.renderOrder = 1;
		this.add(baseMesh);

		baseMesh.material.uniforms.u_modelMatrix.value = baseMesh.matrixWorld;
		baseMesh.material.uniforms.u_inverseModelMatrix.value = baseMesh.matrixWorld
			.clone()
			.invert();

		return baseMesh;
	};

	#constructCountriesMesh = (res: { polygons: any[] }) => {
		const thickness = 1e5 * 0.4;
		const resolution = 2.5;

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
					opacity: 0,
					polygonOffset: true,
					polygonOffsetFactor: 1,
					polygonOffsetUnits: 1,
					transparent: true,
				});

				meshForSelection.geometry.setAttribute(
					"uv",
					this.baseMesh.geometry.attributes.uv
				);
				this.add(meshForSelection);
				this.iso2CountryMeshesMap.set(iso, meshForSelection);
			}

			const line = geom.getLineObject({
				ellipsoid: WGS84_ELLIPSOID,
				resolution,
			});
			line.material = new MeshBasicMaterial({
				opacity: 0.3,
				// color: 0xaaaaaa,
				polygonOffset: true,
				polygonOffsetFactor: 1,
				polygonOffsetUnits: 1,
				transparent: true,
			});
			this.add(line);
		});

		// scale and center the model
		const box = new Box3();
		box.setFromObject(this);
		box.getCenter(this.position).multiplyScalar(-1);
		const size = new Vector3();
		box.getSize(size);
		this.scale.setScalar(1.5 / Math.max(...size));
		this.position.multiplyScalar(this.scale.x);

		console.log("response:", res);
	};

	#isReady = false;
	#readyCallbacks: Array<() => void> = [];

	constructor() {
		super();

		this.rotation.x = -Math.PI / 2; // orig

		this.iso2CountryMeshesMap = new Map();
		this.baseMesh = this.#constructBaseMesh();

		const url = new URL("/world.geojson", import.meta.url);
		new GeoJSONLoader().loadAsync(url).then((res: { polygons: any[] }) => {
			this.#constructCountriesMesh(res);
			this.#isReady = true;
			// flush callbacks
			this.#readyCallbacks.forEach((cb) => cb());
			this.#readyCallbacks.length = 0;
		});
	}

	// if already ready, run cb immediately
	onReady(cb: (globe: this) => void) {
		if (this.#isReady) {
			cb(this);
		} else {
			this.#readyCallbacks.push(() => cb(this));
		}
	}
}
