import { Emitter } from "open-utilities/core/async/mod.js";
import { ArrayEditor, MemoryEditor } from "../data/MemoryEditor.js";

export interface SortingAlgorithm {
	readonly displayName: string;
	readonly run: (array: ArrayEditor, memory: MemoryEditor, onQueueChangeLength: Emitter<number>) => void;
}