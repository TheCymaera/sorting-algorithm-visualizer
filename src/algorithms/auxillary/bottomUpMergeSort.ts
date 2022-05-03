import { ArrayEditor, Allocator } from "../../data/MemoryEditor.js";


export const displayName = "Bottom Up Merge Sort";
export function run(array: ArrayEditor, alloc: Allocator) {
	bottomUpMergeSort(array, alloc.createArray(array.length), array.length);
}


function bottomUpMergeSort(a: ArrayEditor, b: ArrayEditor, n: number) {
	// Each 1-element run in array is already "sorted".
	// Make successively longer sorted runs of length 2, 4, 8, 16... until the whole array is sorted.
	for (let width = 1; width < n; width = 2 * width) {
		for (let i = 0; i < n; i = i + 2 * width) {
			// Merge two runs: A[i:i+width-1] and A[i+width:i+2*width-1] to B[]
			// or copy A[i:n-1] to B[] ( if (i+width >= n) )
			merge(a, i, Math.min(i+width, n), Math.min(i+2*width, n), b);
		}
		// Now work array B is full of runs of length 2*width.
		// Copy array B to array A for the next iteration.
		// A more efficient implementation would swap the roles of A and B.
		copyArray(b, a, n);
		// Now array A is full of runs of length 2*width.
	}
}

//  Left run is A[iLeft :iRight-1].
// Right run is A[iRight:iEnd-1  ].
function merge(a: ArrayEditor, iLeft: number, iRight: number, iEnd: number, b: ArrayEditor) {
	let i = iLeft, j = iRight;
	// While there are elements in the left or right runs...
	for (let k = iLeft; k < iEnd; k++) {
		// If left run head exists and is <= existing right run head.
		if (i < iRight && (j >= iEnd || a[i]!.lessThan(a[j]!))) {
			b[k]!.copy(a[i]!);
			i = i + 1;
		} else {
			b[k]!.copy(a[j]!);
			j = j + 1;    
		}
	} 
}

function copyArray(b: ArrayEditor, a: ArrayEditor, n: number) {
	for (let i = 0; i < n; i++) a[i]!.copy(b[i]!);
}