import { ArrayEditor } from "../../data/MemoryEditor.js";

export const displayName = "Insertion Sort";
export function run(array: ArrayEditor) {
	for (let i = 1; i < array.length; i++) {
		let j = i;
		while (j > 0 && array[j - 1]!.greaterThan(array[j]!)) {
			array[j - 1]!.swap(array[j]!);
			j--;
		}
	}
}