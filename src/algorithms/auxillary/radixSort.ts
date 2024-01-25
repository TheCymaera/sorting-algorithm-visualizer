import { ArrayEditor, MemoryEditor, VectorEditor } from "../../data/MemoryEditor.js";
import { SortingContext } from "../Algorithm.js";

const k = 5;
export const displayName = `Radix Sort (k = ${k})`;
export function radixSort({ array, memory }: SortingContext) {

	// create buckets
	const buckets: VectorEditor[] = [];
	for (let i = 0; i < k; i++) buckets.push(memory.createVector());

	// find the number of digits in the largest number
	const max = Math.max(...array.map(i=>i.read()));
	const digits = max.toString(k).length;

	// sort by each digit
	for (let digit = 0; digit < digits; digit++) {
		// put each number in the correct bucket
		for (let i = 0; i < array.length; i++) {
			const value = array[i]!.read();
			const digitValue = Math.floor(value / Math.pow(k, digit)) % k;
			buckets[digitValue]!.push(value);
		}

		// empty the buckets back into the array
		let n = 0;
		for (const bucket of buckets) {
			for (const item of bucket.toArray()) {
				array[n]!.write(item);
				n += 1;
			}
			bucket.clear();
		}
	}
}