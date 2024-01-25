import { ArrayEditor } from "../../data/MemoryEditor.js";
import { shuffle as shuffle } from "./shuffle.js";
import { SortingContext } from "../Algorithm.js";

export const displayName = "Bogo Sort";
export async function bogoSort(context: SortingContext) {
	while (!isSorted(context.array)) {
		shuffle(context);

		// wait till there are less than 5 queued events
		while (await context.onQueueChangeLength.single() > 5);
	}
}


function isSorted(array: ArrayEditor) {
	for (let i = 0; i < array.length - 1; i++) {
		if (array[i]!.greaterThan(array[i + 1]!)) return false;
	}
	return true;
}