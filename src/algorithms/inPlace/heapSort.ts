import { ArrayEditor } from "../../data/MemoryEditor.js";
import { SortingContext } from "../Algorithm.js";

export function heapSort({ array }: SortingContext) {
	for (let i = array.length - 1; i >= 0; i--) {
		heapify(array, i);
	}
	for (let i = array.length - 1; i >= 0; i--) {
		array[0]!.swap(array[i]!);
		heapify(array, 0, i - 1);
	}
}

function heapify(array: ArrayEditor, index: number, end = array.length - 1) {
	let largest = index;
	const left = 2 * index + 1;
	const right = 2 * index + 2;
	if (left <= end && array[left]!.greaterThan(array[largest]!)) {
		largest = left;
	}
	if (right <= end && array[right]!.greaterThan(array[largest]!)) {
		largest = right;
	}
	if (largest !== index) {
		array[index]!.swap(array[largest]!);
		heapify(array, largest, end);
	}
}