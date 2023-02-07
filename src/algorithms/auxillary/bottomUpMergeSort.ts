import { ArrayEditor, MemoryEditor } from "../../data/MemoryEditor.js";
import { copyArray, merge } from "./merge.js";


export const displayName = "Bottom Up Merge Sort";
export function run(array: ArrayEditor, memory: MemoryEditor) {
	const auxArray = memory.createArray(array.length);

	let a = array;
	let b = auxArray;

	for (let width = 1; width < array.length; width *= 2) {
		for (let i = 0; i < array.length; i = i + 2 * width) {
			const left = i;
			const middle = Math.min(left+width, array.length);
			const right = Math.min(middle+width, array.length);
			merge(b, a, left, middle, right);
		}
		
		[a,b] = [b,a];
	}

	// copy array
	if (a != array) copyArray(array, auxArray);
}