import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

type ClassValue = string | false | null | undefined;

/**
 * Utility function to merge Tailwind CSS classes with clsx
 */
export function cn(...inputs: ClassValue[]): string {
	return twMerge(clsx(inputs));
}
