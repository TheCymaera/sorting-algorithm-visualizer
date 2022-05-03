import { AwaitableIterable } from "open-utilities/async";
import { Memory } from "src/data/Memory.js";
import { EditorEvent } from "../data/MemoryEditor.js";

export interface Presentation {
	readonly displayName: string;
	readonly element: HTMLElement;
	readonly sidebarElement: HTMLElement;
	present(data: Memory, changes: AwaitableIterable<[Memory, EditorEvent]>): any;
}