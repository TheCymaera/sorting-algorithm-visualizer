import { ArrayEditor } from "../../data/MemoryEditor.js";

export const displayName = "Bubble Sort";
export function run(array: ArrayEditor) {
	for (let i = 0; i < array.length; i++) {
		for (let j = 0; j < array.length - i - 1; j++) {
			if (array[j]!.greaterThan(array[j + 1]!)) {
				array[j]!.swap(array[j + 1]!);
			}
		}
	}
}
