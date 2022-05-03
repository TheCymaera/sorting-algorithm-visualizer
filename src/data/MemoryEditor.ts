import { CustomEmitter } from "open-utilities/async";
import { Memory, MemoryPath } from "./Memory.js";

export class Allocator {
	constructor(data: Memory, emitter: CustomEmitter<EditorEvent>) {
		this.#data = data;
		this.#emitter = emitter;
	}

	getArray(id: number) {
		const out: AddressEditor[] = [];
		for (let i = 0; i < this.#data.arrays[id]!.length; i++) {
			out.push(new AddressEditor(this.#data, new MemoryPath(id, i), this.#emitter));
		}
		return out as ArrayEditor;
	}

	createArray(length: number): ArrayEditor {
		this.#emitter.emit(new CreateArrayEvent(length).applyTo(this.#data));
		return this.getArray(this.#data.arrays.length - 1);
	}

	createVector(): VectorEditor {
		this.#emitter.emit(new CreateArrayEvent(0).applyTo(this.#data));
		return new VectorEditor(this.#data, this.#data.arrays.length - 1, this.#emitter);
	}

	readonly #data: Memory;
	readonly #emitter: CustomEmitter<EditorEvent>;
}

export type ArrayEditor = readonly AddressEditor[];

export class VectorEditor {
	constructor(memory: Memory, id: number, emitter: CustomEmitter<EditorEvent>) {
		this.#memory = memory;
		this.#id = id;
		this.#emitter = emitter;
	}

	get(index: number) {
		return new AddressEditor(this.#memory, new MemoryPath(this.#id, index), this.#emitter);
	}

	push(value: number) {
		const index = this.#memory.arrays[this.#id]!.length;
		this.#emitter.emit(new SetEvent(new MemoryPath(this.#id, index), value).applyTo(this.#memory));
		return this.get(index);
	}

	toArray() {
		const out: AddressEditor[] = [];
		for (let i = 0; i < this.#memory.arrays[this.#id]!.length; i++) {
			out.push(this.get(i));
		}
		return out;
	}

	#memory: Memory;
	#id: number;
	#emitter: CustomEmitter<EditorEvent>;
}

export class AddressEditor {
	constructor(data: Memory, path: MemoryPath, emitter: CustomEmitter<EditorEvent>) {
		this.#data = data;
		this.#path = path;
		this.#emitter = emitter;
	}

	read() {
		this.#emitter.emit(new GetEvent(this.#path).applyTo(this.#data));
		return this.#data.get(this.#path);
	}

	write(value: number) {
		this.#emitter.emit(new SetEvent(this.#path, value).applyTo(this.#data));
	}

	copy(other: AddressEditor) {
		this.#emitter.emit(new CopyEvent(this.#path, other.#path).applyTo(this.#data));
	}

	swap(other: AddressEditor) {
		this.#emitter.emit(new SwapEvent(this.#path, other.#path).applyTo(this.#data));
	}
	
	lessThan(other: AddressEditor) {
		this.#emitter.emit(new CompareEvent(this.#path, other.#path).applyTo(this.#data));
		return this.#data.get(this.#path) < this.#data.get(other.#path);
	}

	greaterThan(other: AddressEditor) {
		this.#emitter.emit(new CompareEvent(this.#path, other.#path).applyTo(this.#data));
		return this.#data.get(this.#path) > this.#data.get(other.#path);
	}

	lessThanOrEqualTo(other: AddressEditor) {
		this.#emitter.emit(new CompareEvent(this.#path, other.#path).applyTo(this.#data));
		return this.#data.get(this.#path)! <= other.#data.get(other.#path)!;
	}

	greaterThanOrEqualTo(other: AddressEditor) {
		this.#emitter.emit(new CompareEvent(this.#path, other.#path).applyTo(this.#data));
		return this.#data.get(this.#path)! >= other.#data.get(other.#path)!;
	}

	readonly #data: Memory;
	readonly #path: MemoryPath;
	readonly #emitter: CustomEmitter<EditorEvent>;
}

export class CreateArrayEvent {
	constructor(readonly length: number) { }

	applyTo(memory: Memory) {
		memory.arrays.push(new Array(this.length).fill(0));
		return this;
	}
}

export class GetEvent {
	constructor(readonly path: MemoryPath) { }

	applyTo(_memory: Memory) {
		// do nothing
		return this;
	}
}

export class SetEvent {
	constructor(readonly path: MemoryPath, readonly value: number) { }

	applyTo(memory: Memory) {
		memory.write(this.path, this.value);
		return this;
	}
}


export class CompareEvent {
	constructor(readonly lhs: MemoryPath, readonly rhs: MemoryPath) {}

	applyTo(_memory: Memory) {
		// do nothing
		return this;
	}
}

export class CopyEvent {
	constructor(readonly lhs: MemoryPath, readonly rhs: MemoryPath) {}

	applyTo(data: Memory) {
		data.write(this.lhs, data.get(this.rhs));
		return this;
	}
}

export class SwapEvent {
	constructor(readonly lhs: MemoryPath, readonly rhs: MemoryPath) {}

	applyTo(memory: Memory) {
		const lhs = memory.get(this.lhs);
		const rhs = memory.get(this.rhs);
		memory.write(this.lhs, rhs);
		memory.write(this.rhs, lhs);
		return this;
	}
}

export type EditorEvent = CreateArrayEvent | GetEvent | SetEvent | CompareEvent | CopyEvent | SwapEvent;