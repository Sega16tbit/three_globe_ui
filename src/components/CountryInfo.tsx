import { Check, X } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";

export function CountryInfo() {
	const [location] = useLocation();
	// const [match] = useRoute("/");
	const countryCode = location.slice(1);

	const { error, data, isFetching } = useQuery({
		queryKey: ["country", countryCode],
		queryFn: async () => {
			const response = await fetch(
				"https://restcountries.com/v3.1/alpha/" + countryCode
			);
			return await response.json();
		},
		// enabled: !match,
		enabled: !!countryCode,
	});
	console.log("Country Data:", data);

	if (!data && !isFetching) return null;
	if (isFetching) return "Loading...";
	if (error) return "An error has occurred: " + error.message;

	return (
		<div>
			{data[0].name && (
				<p className=" text-5xl text-bold text-center my-10">
					{data[0].name.common}
				</p>
			)}
			<div className="mb-3">
				{data[0].region && <p>Region: {data[0].region}</p>}
				{data[0].subregion && <p>Subregion: {data[0].subregion}</p>}
				{data[0].area && <p>Area: {data[0].area}</p>}
				{data[0].capital && <p>Capital: {data[0].capital}</p>}
				{data[0].currencies && (
					<p>Currencies: {Object.keys(data[0].currencies)}</p>
				)}
				{data[0].independent && (
					<div className="flex">
						<p>Independent:</p>
						{data[0].independent ? (
							<HugeiconsIcon
								icon={Check}
								strokeWidth={2}
								className="pointer-events-none size-4 text-muted-foreground"
							/>
						) : (
							<HugeiconsIcon
								icon={X}
								strokeWidth={2}
								className="pointer-events-none size-4 text-muted-foreground"
							/>
						)}
					</div>
				)}
				{data[0].landlocked && (
					<div className="flex">
						<p>Landlocked:</p>
						{data[0].landlocked ? (
							<HugeiconsIcon
								icon={Check}
								strokeWidth={2}
								className="pointer-events-none size-4 text-muted-foreground"
							/>
						) : (
							<HugeiconsIcon
								icon={X}
								strokeWidth={2}
								className="pointer-events-none size-4 text-muted-foreground"
							/>
						)}
					</div>
				)}
				{data[0].gini && (
					<p>
						Gini index:{" "}
						{(() => {
							const [key, value] = Object.entries(data[0].gini)[0];
							return `${value} (${key})`;
						})()}
					</p>
				)}
			</div>
		</div>
	);
}
