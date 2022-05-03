import { Emitter } from "open-utilities/async";
import { ArrayEditor, Allocator } from "../data/MemoryEditor.js";

export interface SortingAlgorithm {
	readonly displayName: string;
	readonly run: (array: ArrayEditor, memory: Allocator, queue: Emitter.Queue<any>) => void;
}