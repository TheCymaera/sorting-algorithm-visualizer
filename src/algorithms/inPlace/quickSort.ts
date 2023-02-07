import { ArrayEditor } from "../../data/MemoryEditor.js";

export const displayName = "Quick Sort";
export function run(array: ArrayEditor) {
	quickSort(array, 0, array.length - 1);
}

function quickSort(A: ArrayEditor, left: number, right: number) { 
	if (left >= right || left < 0) return;

	const p = partition(A, left, right);
	
	quickSort(A, left, p - 1);
	quickSort(A, p + 1, right);
}

function partition(A: ArrayEditor, left: number, right: number) {
	let i = left;

	for (let j = left; j < right; j++) { 
		if (A[j]!.lessThan(A[right]!)) {
			A[i]!.swap(A[j]!);
			i++;
		}
	}

	A[i]!.swap(A[right]!);
	
	return i;
}