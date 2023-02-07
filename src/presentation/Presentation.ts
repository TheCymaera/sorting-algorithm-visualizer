import { AwaitableIterable } from "open-utilities/core/async/mod.js";
import { EditorEvent } from "../data/Events.js";
import { Memory } from "../data/Memory.js";

export interface Presentation {
	readonly displayName: string;
	readonly element: HTMLElement;
	readonly configElement: HTMLElement;
	present(data: Memory, changes: AwaitableIterable<[Memory, EditorEvent]>): any;
}