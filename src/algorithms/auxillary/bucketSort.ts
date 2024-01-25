import { VectorEditor } from "../../data/MemoryEditor.js";
import { SortingContext } from "../Algorithm.js";
import { quickSort } from "../inPlace/quickSort.js";

export const displayName = "Bucket Sort (k = 5)";
export const k = 5;
export function bucketSort(context: SortingContext) {
	const { array, memory } = context;

	const buckets: VectorEditor[] = [];
	for (let i = 0; i < k; i++) buckets.push(memory.createVector());

	const max = Math.max(...array.map(i=>i.read()));

	for (let i = 0; i < array.length; i++) {
		const value = array[i]!.read();
		const percent = value / max;
		const bucketIndex = value === max ? (k-1) : Math.floor(k * percent);
		buckets[bucketIndex]!.push(value);
	}

	for (const bucket of buckets) quickSort(context.withArray(bucket.toArray()));

	let n = 0;
	for (const bucket of buckets) {
		for (const item of bucket.toArray()) {
			array[n]!.write(item);
			n += 1;
		}
	}
}