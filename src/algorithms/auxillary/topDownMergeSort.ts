import { ArrayEditor, MemoryEditor } from "../../data/MemoryEditor.js";
import { copyArray, merge } from "./merge.js";


export const displayName = "Top Down Merge Sort";
export function run(array: ArrayEditor, alloc: MemoryEditor) {
	const auxArray = alloc.createArray(array.length);
	copyArray(auxArray, array);
	splitMerge(array, auxArray, 0, array.length);
}

function splitMerge(output: ArrayEditor, array: ArrayEditor, left: number, right: number) {
	if (right - left <= 1) return;
	
	const middle = Math.floor((right + left) / 2);

	splitMerge(array, output, left, middle);
	splitMerge(array, output, middle, right);
	
	merge(output, array, left, middle, right);
}



