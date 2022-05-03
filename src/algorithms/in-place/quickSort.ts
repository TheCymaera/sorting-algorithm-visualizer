import { Allocator, ArrayEditor } from "../../data/MemoryEditor.js";

export const displayName = "Quick Sort";
export function run(array: ArrayEditor) {
	quickSort(array, 0, array.length - 1);
}

// Sorts a (portion of an) array, divides it into partitions, then sorts those
function quickSort(A: ArrayEditor, lo: number, hi: number) { 
	// Ensure indices are in correct order
	if (lo >= hi || lo < 0) return;

	// Partition array and get the pivot index
	let p = partition(A, lo, hi);
	
	// Sort the two partitions
	quickSort(A, lo, p - 1); // Left side of pivot
	quickSort(A, p + 1, hi); // Right side of pivot
}

// Divides array into two partitions
function partition(A: ArrayEditor, lo: number, hi: number) {
	// Temporary pivot index
	let i = lo - 1;

	for (let j = lo; j < hi; j++) { 
		// If the current element is less than or equal to the pivot
		if (A[j]!.lessThan(A[hi]!)) { 
			// Move the temporary pivot index forward
			i = i + 1;

			// Swap the current element with the element at the temporary pivot index
			A[i]!.swap(A[j]!);
		}
	}
	// Move the pivot element to the correct pivot position (between the smaller and larger elements)
	i = i + 1;
	A[i]!.swap(A[hi]!);
	return i; // the pivot index
}