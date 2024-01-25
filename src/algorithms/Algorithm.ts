import { Emitter } from "open-utilities/core/async/mod.js";
import { ArrayEditor, MemoryEditor } from "../data/MemoryEditor.js";

export class SortingContext {
	constructor(
		readonly memory: MemoryEditor,
		readonly array: ArrayEditor,
		readonly onQueueChangeLength: Emitter<number>
	) {}

	withArray(array: ArrayEditor) {
		return new SortingContext(this.memory, array, this.onQueueChangeLength);
	}
}