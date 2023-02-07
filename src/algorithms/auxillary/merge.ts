import { ArrayEditor } from "../../data/MemoryEditor.js";

export function copyArray(output: ArrayEditor, array: ArrayEditor) {
	for (let i = 0; i < output.length; i++) {
		output[i]!.write(array[i]!);
	}
}

export function merge(output: ArrayEditor, array: ArrayEditor, left: number, middle: number, right: number) {
	let iLeft = left, iRight = middle;
	for (let k = left; k < right; k++) {
		if (iLeft < middle && (iRight >= right || array[iLeft]!.lessThan(array[iRight]!))) {
			output[k]!.write(array[iLeft]!);
			iLeft++;
		} else {
			output[k]!.write(array[iRight]!);
			iRight++;    
		}
	}
}