import { Emitter } from "open-utilities/async";
import { ArrayEditor, Allocator } from "../../data/MemoryEditor.js";
import { run as shuffle } from "./shuffle.js";

export const displayName = "Bogo Sort";
export async function run(array: ArrayEditor, alloc: Allocator, queue: Emitter.Queue<any>) {
	while (!isSorted(array)) {
		shuffle(array);
		while (!queue.isEmpty()) await new Promise(resolve=>queue.onQueueShifted.addOnceListener(resolve));
	}
}


function isSorted(array: ArrayEditor) {
	for (let i = 0; i < array.length - 1; i++) {
		if (array[i]!.greaterThan(array[i + 1]!)) return false;
	}
	return true;
}