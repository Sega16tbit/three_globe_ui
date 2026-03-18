// import { Check, X } from "@hugeicons/core-free-icons";
// import { HugeiconsIcon } from "@hugeicons/react";

import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { GiniCard } from "./GiniCard";

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
		<article className="flex text-neutral-950 portrait:flex-col landscape:mt-6 landscape:gap-6">
			<header className="my-10 landscape:mx-16 landscape:my-auto landscape:pb-4">
				{data[0].name && (
					<h1 className="text-center text-5xl font-medium">
						{data[0].name.common}
					</h1>
				)}
				<div className="mx-auto mt-4 flex max-w-min rounded-full bg-neutral-300">
					{data[0].region && (
						<h2 className="rounded-full bg-neutral-200 px-4 py-1 text-xs text-nowrap">
							{data[0].region}
						</h2>
					)}
					{data[0].subregion && (
						<h3 className="rounded-full bg-neutral-300 px-4 py-1 pl-2 text-xs text-nowrap">
							{data[0].subregion}
						</h3>
					)}
				</div>
			</header>
			<section className="--mb-3">
				{/* {data[0].area && <p>Area: {data[0].area}</p>}
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
				)} */}
				{data[0].gini && (
					<>
						{(() => {
							const [key, value] = Object.entries(data[0].gini)[0];
							return <GiniCard index={value} year={key} />;
						})()}
					</>
				)}
			</section>
		</article>
	);
}
