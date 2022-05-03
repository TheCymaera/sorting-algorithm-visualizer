import { ArrayEditor, Allocator } from "../../data/MemoryEditor.js";


export const displayName = "Top Down Merge Sort";
export function run(array: ArrayEditor, alloc: Allocator) {
	topDownMergeSort(array, alloc.createArray(array.length), array.length);
}

function copyArray(output: ArrayEditor, iBegin: number, iEnd: number, input: ArrayEditor) {
	for (let i = iBegin; i < iEnd; i++) output[i]!.copy(input[i]!);
}

// Array A[] has the items to sort; array B[] is a work array.
function topDownMergeSort(a: ArrayEditor, b: ArrayEditor, n: number) {
	copyArray(b, 0, n, a);           // one time copy of A[] to B[]
	splitMerge(b, 0, n, a);   // sort data from B[] into A[]
}

// Split A[] into 2 runs, sort both runs into B[], merge both runs from B[] to A[]
// iBegin is inclusive; iEnd is exclusive (A[iEnd] is not in the set).
function splitMerge(b: ArrayEditor, iBegin: number, iEnd: number, a: ArrayEditor) {
	if (iEnd - iBegin <= 1)                     // if run size == 1
		return;                                 //   consider it sorted
	// split the run longer than 1 item into halves
	let iMiddle = Math.floor((iEnd + iBegin) / 2);              // iMiddle = mid point
	// recursively sort both runs from array A[] into B[]
	splitMerge(a, iBegin,  iMiddle, b);  // sort the left  run
	splitMerge(a, iMiddle,    iEnd, b);  // sort the right run
	// merge the resulting runs from array B[] into A[]
	merge(b, iBegin, iMiddle, iEnd, a);
}

//  Left source half is A[ iBegin:iMiddle-1].
// Right source half is A[iMiddle:iEnd-1   ].
// Result is            B[ iBegin:iEnd-1   ].
function merge(a: ArrayEditor, iBegin: number, iMiddle: number, iEnd: number, b: ArrayEditor) {
	let i = iBegin, j = iMiddle;

	// While there are elements in the left or right runs...
	for (let k = iBegin; k < iEnd; k++) {
		// If left run head exists and is <= existing right run head.
		if (i < iMiddle && (j >= iEnd || a[i]!.lessThanOrEqualTo(a[j]!))) {
			b[k]!.copy(a[i]!);
			i++;
		} else {
			b[k]!.copy(a[j]!);
			j++;
		}
	}
}


