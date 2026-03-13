import { Item, ItemContent, ItemDescription, ItemTitle } from "./ui/item";

type Country = { code: string; value: string; continent: string; label: string };

export function CountryListItem({ country }: { country: Country }) {
	return (
		<Item size="xs" className="p-0">
			<ItemContent>
				<ItemTitle className="whitespace-nowrap">{country.label}</ItemTitle>
				<ItemDescription>
					{country.continent} ({country.code})
				</ItemDescription>
			</ItemContent>
		</Item>
	);
}
