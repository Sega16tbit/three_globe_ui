import fs from "fs";
import geojson from "./world.json" with { type: "json" };

function slugify(name) {
	return name
		.toLowerCase()
		.replace(/[^a-z0-9\s-]/g, "")
		.trim()
		.replace(/\s+/g, "-");
}

function buildCountries(geojson) {
	const result = [];

	for (const feature of geojson.features) {
		const props = feature.properties;

		// skip invalid
		if (!props?.iso_a3 || props.iso_a3 === "-99") continue;

		// skip dependencies if desired
		if (props.type !== "Sovereign country") continue;

		const label = props.name;
		const value = slugify(label);

		result.push({
			code: props.iso_a3,
			value,
			label,
			continent: props.continent,
		});
	}

	// sort alphabetically
	result.sort((a, b) => a.label.localeCompare(b.label));

	return result;
}

const countries = buildCountries(geojson);

const fileContent = `export const countries = ${JSON.stringify(countries, null, 2)};\n`;

fs.writeFileSync("./countries.js", fileContent);
