import { SortingContext } from "../Algorithm.js";

export const displayName = "Shell Sort";
export function shellSort({ array }: SortingContext) {
	let gap = array.length;
	while (gap > 1) {
		gap = Math.floor(gap / 2);
		for (let i = gap; i < array.length; i++) {
			let j = i;
			while (j >= gap && array[j - gap]!.greaterThan(array[j]!)) {
				array[j - gap]!.swap(array[j]!);
				j -= gap;
			}
		}
	}
}
