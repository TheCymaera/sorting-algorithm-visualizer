import { ArrayEditor } from "../../data/MemoryEditor.js";
import { SortingContext } from "../Algorithm.js";

export const displayName = "Quick Sort";
export function quickSort({ array }: SortingContext) {
	withLeftRight(array, 0, array.length - 1);
}

function withLeftRight(A: ArrayEditor, left: number, right: number) { 
	if (left >= right || left < 0) return;

	const p = partition(A, left, right);
	
	withLeftRight(A, left, p - 1);
	withLeftRight(A, p + 1, right);
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