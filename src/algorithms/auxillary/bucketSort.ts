import { ArrayEditor, Allocator, VectorEditor } from "../../data/MemoryEditor.js";
import { run as sort } from "../in-place/quickSort.js";

export const displayName = "Bucket Sort (k = 5)";
export const k = 5;
export function run(array: ArrayEditor, alloc: Allocator) {
	const buckets: VectorEditor[] = [];
	for (let i = 0; i < k; i++) buckets.push(alloc.createVector());

	const max = Math.max(...array.map(i=>i.read()));

	for (let i = 0; i < array.length; i++) {
		const value = array[i]!.read();
		const percent = value / max;
		const bucketIndex = value === max ? (k-1) : Math.floor(k * percent);
		buckets[bucketIndex]!.push(value);
	}

	for (const bucket of buckets) sort(bucket.toArray());

	let n = 0;
	for (const bucket of buckets) {
		for (const item of bucket.toArray()) {
			array[n]!.copy(item);
			n += 1;
		}
	}
}