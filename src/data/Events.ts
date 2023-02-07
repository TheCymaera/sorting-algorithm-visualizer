import { Memory, Pointer } from "./Memory.js";

export abstract class EditorEvent {
	abstract reads(): Pointer[];
	abstract writes(): Pointer[];
	abstract applyTo(memory: Memory): this;
}

export class CreateArrayEvent extends EditorEvent {
	constructor(readonly length: number) { super(); }

	applyTo(memory: Memory) {
		memory.arrays.push(new Array(this.length).fill(0));
		return this;
	}

	reads() {
		return [];
	}

	writes() {
		return [];
	}
}

export class ReadEvent extends EditorEvent {
	readonly pointers: Pointer[];

	constructor(...pointers: Pointer[]) { 
		super();
		this.pointers = pointers;
	}

	applyTo(_memory: Memory) {
		// do nothing
		return this;
	}

	reads() {
		return [...this.pointers];
	}
	writes() {
		return [];
	}

}

export class WriteEvent extends EditorEvent {
	constructor(
		readonly pointer: Pointer, 
		readonly value: number|Pointer,
		readonly transformer: (a: number, b: number)=>number = (_,b)=>b,
	) { super(); }

	applyTo(memory: Memory) {
		const a = memory.read(this.pointer);
		const b = this.value instanceof Pointer ? memory.read(this.value) : this.value;
		memory.write(this.pointer, this.transformer(a, b));
		return this;
	}

	reads() {
		if (this.value instanceof Pointer) return [ this.value ];
		return [];
	}

	writes() {
		return [this.pointer];
	}
}

export class SwapEvent {
	constructor(readonly lhs: Pointer, readonly rhs: Pointer) {}

	applyTo(memory: Memory) {
		const lhs = memory.read(this.lhs);
		const rhs = memory.read(this.rhs);
		memory.write(this.lhs, rhs);
		memory.write(this.rhs, lhs);
		return this;
	}

	reads() {
		return [this.lhs, this.rhs];
	}

	writes() {
		return [this.lhs, this.rhs];
	}
}