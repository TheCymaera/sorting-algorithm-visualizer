import { Pointer } from "./Memory.js";


export class CreateArrayEvent {
	constructor(readonly length: number) { }
}

export class ReadEvent {
	readonly pointers: Pointer[];

	constructor(pointers: Pointer[]) { 
		this.pointers = pointers;
	}
}

export class WriteEvent {
	constructor(
		readonly pointer: Pointer, 
		readonly value: number|Pointer,
		readonly transformer: (a: number, b: number)=>number = (_,b)=>b,
	) { }
}

export class SwapEvent {
	constructor(readonly lhs: Pointer, readonly rhs: Pointer) {}
}

export type EditorEvent = CreateArrayEvent|ReadEvent|WriteEvent|SwapEvent;