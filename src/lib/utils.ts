import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function kebabToTitleCaseWithSpaces(str: string) {
	return str
		.split("-") // Split the string into an array of words
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) // Capitalize the first letter of each word
		.join(" "); // Join the words back together with spaces
}

export function renderValue(value: unknown) {
	if (typeof value === "string" || typeof value === "number") {
		return value;
	}

	return null;
}
