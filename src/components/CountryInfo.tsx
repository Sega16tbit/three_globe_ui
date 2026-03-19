import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { GiniCard } from "./GiniCard";
import { Spinner } from "./ui/spinner";
import { HugeiconsIcon } from "@hugeicons/react";
import { X } from "@hugeicons/core-free-icons";

export function CountryInfo() {
	const [location] = useLocation();
	// const [match] = useRoute("/");
	const countryCode = location.slice(1);

	const { error, data, isFetching, isLoading } = useQuery({
		queryKey: ["country", countryCode],
		queryFn: async () => {
			const response = await fetch(
				"https://restcountries.com/v3.1/alpha/" + countryCode
			);
			return await response.json();
		},
		enabled: !!countryCode,
		placeholderData: (prev) => prev,
	});

	console.log("Country Data:", data);

	if (error) return "An error has occurred: " + error.message;
	if (!data) return;
	return (
		<>
			<article className="-border-pink-500 relative flex flex-col gap-2 border bg-white p-2 text-neutral-950">
				<Link href="/" className={"absolute top-3 right-3"}>
					<HugeiconsIcon icon={X} strokeWidth={2} />
				</Link>
				{isFetching && <Spinner className="absolute top-3 left-3" />}
				<header className="-bg-yellow-400 relative my-10">
					<h1 className="text-center text-5xl font-medium">
						{isLoading ? "Loading..." : data[0].name && data[0].name.common}
					</h1>

					<div
						className={`${isLoading && "invisible"} mx-auto mt-4 flex max-w-min rounded-full bg-neutral-300`}
					>
						<h2 className="rounded-full bg-neutral-200 px-4 py-1 text-xs text-nowrap">
							{isLoading ? "_" : data[0].region && data[0].region}
						</h2>
						<h3
							className={`rounded-full bg-neutral-300 px-4 py-1 pl-2 text-xs text-nowrap`}
						>
							{isLoading ? "_" : data[0].subregion && data[0].subregion}
						</h3>
					</div>
				</header>
				<section>
					{isLoading ? (
						<GiniCard className="invisible" />
					) : (
						data[0].gini && (
							<>
								{(() => {
									const [key, value] = Object.entries(data[0].gini)[0];
									return <GiniCard index={value} year={key} />;
								})()}
							</>
						)
					)}
					{}
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
				</section>
			</article>
		</>
	);
}
