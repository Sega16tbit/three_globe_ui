import fs from "fs";
import geojson from "./world.json" with { type: "json" };

function toUrlKey(name) {
	return name
		.normalize("NFKD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLowerCase()
		.replace(/\s+/g, "-")
		.replace(/[^a-z0-9\-_~]/g, "")
		.replace(/-+/g, "-")
		.replace(/^-|-$/g, "");
}

function buildCountryLookups(geojson) {
	if (!geojson) console.warn("Geojson not found");

	const nameToIso = {};
	// const isoToName = {};

	for (const feature of geojson.features) {
		const { name_long, iso_a3_eh, type } = feature.properties;
		if (!name_long || !iso_a3_eh) continue;

		const key = toUrlKey(name_long);

		nameToIso[key] = iso_a3_eh;
		// isoToName[iso_a3_eh] = key;
	}

	// const isoToName = Object.fromEntries(
	// 	Object.entries(nameToIso).map(([key, value]) => [value, key])
	// );

	fs.mkdirSync("./countryLookups", { recursive: true });

	const nameToIsoFile =
		"export const nameToIso_a3 = " + JSON.stringify(nameToIso, null, 2) + ";\n";

	// const isoToNameFile =
	// 	"export const iso_a3ToName = " + JSON.stringify(isoToName, null, 2) + ";\n";

	fs.writeFileSync("./countryLookups/nameToIso_a3.js", nameToIsoFile);
	// fs.writeFileSync("./countryLookups/iso_a3ToName.js", isoToNameFile);
}

buildCountryLookups(geojson);
