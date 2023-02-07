import { ArrayEditor } from "../../data/MemoryEditor.js";

export const displayName = "Selection Sort";
export function run(array: ArrayEditor) {
	for (let current = 0; current < array.length; current++) {
		let max = current;
		for (let i = current + 1; i < array.length; i++) {
			if (array[max]!.greaterThan(array[i]!)) max = i;
		}
		array[current]!.swap(array[max]!);
	}
}
