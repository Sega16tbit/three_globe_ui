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
import { cn } from "@/lib/utils";

type Props = {
	classNameInput?: string;
};

export function CountryListWithSearch({ classNameInput }: Props) {
	const [, navigate] = useLocation();

	return (
		<Combobox
			items={countries.filter((country) => country.code !== "")}
			itemToStringValue={(country: (typeof countries)[number]) => country.label}
			onValueChange={(value) => navigate(value ? `/${value.code}` : `/`)}
		>
			<ComboboxInput
				className={cn("h-12 w-full bg-white", classNameInput)}
				placeholder="Search countries..."
			/>
			<ComboboxContent sideOffset={30}>
				<ComboboxEmpty>No countries found.</ComboboxEmpty>
				<ComboboxList>
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
