import { ArrayEditor } from "../../data/MemoryEditor.js";

export const displayName = "Shuffle";
export function run(array: ArrayEditor) {
	for (let i = 0; i < array.length; i++) {
		const j = Math.floor(Math.random() * (i + 1));
		array[i]!.swap(array[j]!);
	}
}