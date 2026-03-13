"use client";

import {
	Combobox,
	ComboboxContent,
	ComboboxEmpty,
	ComboboxInput,
	ComboboxItem,
	ComboboxList,
} from "@/components/ui/combobox";
import { CountryListItem } from "./CountryListItem";
import { countries } from "@/assets/data/countryLookups/countries";
import { useLocation } from "wouter";

export function CountryListWithSearch() {
	const [, navigate] = useLocation();

	return (
		<Combobox
			items={countries.filter((country) => country.code !== "")}
			itemToStringValue={(country: (typeof countries)[number]) => country.label}
			onValueChange={(value) => navigate(value ? `/${value.code}` : `/`)}
		>
			<ComboboxInput
				className={"w-full h-12 portrait:max-w-md bg-white"}
				placeholder="Search countries..."
			/>
			<ComboboxContent className={""} sideOffset={30}>
				<ComboboxEmpty>No countries found.</ComboboxEmpty>
				<ComboboxList
				// for later
				// className={
				// 	"landscape:max-h-[calc(100vh-10rem)] sm:portrait:max-h-[calc(60vh-8rem)] portrait:max-h-[calc(60vh-6rem)]"
				// }
				>
					{(country) => (
						<ComboboxItem key={country.code} value={country}>
							<CountryListItem country={country} />
						</ComboboxItem>
					)}
				</ComboboxList>
			</ComboboxContent>
		</Combobox>
	);
}
