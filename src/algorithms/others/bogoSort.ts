import { Emitter } from "open-utilities/core/async/mod.js";
import { ArrayEditor, MemoryEditor } from "../../data/MemoryEditor.js";
import { run as shuffle } from "./shuffle.js";

export const displayName = "Bogo Sort";
export async function run(array: ArrayEditor, _: MemoryEditor, onQueueChangeLength: Emitter<number>) {
	while (!isSorted(array)) {
		shuffle(array);

		// wait till there are less than 5 queued events
		while (await onQueueChangeLength.single() > 5);
	}
}


function isSorted(array: ArrayEditor) {
	for (let i = 0; i < array.length - 1; i++) {
		if (array[i]!.greaterThan(array[i + 1]!)) return false;
	}
	return true;
}