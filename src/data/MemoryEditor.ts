import { CustomEmitter } from "open-utilities/core/async/mod.js";
import { CreateArrayEvent, EditorEvent, ReadEvent, WriteEvent, SwapEvent } from "./Events.js";
import { Memory, Pointer } from "./Memory.js";

export class MemoryEditor {
	readonly emitter: CustomEmitter<EditorEvent>;

	constructor(memory: Memory, emitter = new CustomEmitter<EditorEvent>) {
		this.#memory = memory;
		this.emitter = emitter;
	}

	getArray(id: number) {
		const out: PointerEditor[] = [];
		for (let i = 0; i < this.#memory.arrays[id]!.length; i++) {
			out.push(new PointerEditor(this.#memory, new Pointer(id, i), this.emitter));
		}
		return out as ArrayEditor;
	}

	createArray(length: number): ArrayEditor {
		this.emitter.emit(new CreateArrayEvent(length).applyTo(this.#memory));
		return this.getArray(this.#memory.arrays.length - 1);
	}

	createVector(): VectorEditor {
		this.emitter.emit(new CreateArrayEvent(0).applyTo(this.#memory));
		return new VectorEditor(this.#memory, this.#memory.arrays.length - 1, this.emitter);
	}

	readonly #memory: Memory;
}

export type ArrayEditor = readonly PointerEditor[];

export class VectorEditor {
	length = 0;

	constructor(memory: Memory, id: number, emitter: CustomEmitter<EditorEvent>) {
		this.#memory = memory;
		this.#id = id;
		this.#emitter = emitter;
	}

	get(index: number) {
		return new PointerEditor(this.#memory, new Pointer(this.#id, index), this.#emitter);
	}

	push(value: number) {
		const index = this.length;
		this.#emitter.emit(new WriteEvent(new Pointer(this.#id, index), value).applyTo(this.#memory));
		this.length++;
		return this.get(index);
	}

	clear() {
		this.length = 0;
	}

	toArray() {
		const out: PointerEditor[] = [];
		for (let i = 0; i < this.length; i++) {
			out.push(this.get(i));
		}
		return out;
	}

	readonly #memory: Memory;
	readonly #id: number;
	readonly #emitter: CustomEmitter<EditorEvent>;
}

export class PointerEditor {
	constructor(memory: Memory, pointer: Pointer, emitter: CustomEmitter<EditorEvent>) {
		this.#memory = memory;
		this.#pointer = pointer;
		this.#emitter = emitter;
	}

	read() {
		this.#emitter.emit(new ReadEvent(this.#pointer).applyTo(this.#memory));
		return this.#memory.read(this.#pointer);
	}

	write(value: number|PointerEditor) {
		const pointer = value instanceof PointerEditor ? value.#pointer : value;
		this.#emitter.emit(new WriteEvent(this.#pointer, pointer).applyTo(this.#memory));
	}

	add(value: number|PointerEditor) {
		const pointer = value instanceof PointerEditor ? value.#pointer : value;
		this.#emitter.emit(new WriteEvent(this.#pointer, pointer, (a,b)=> a + b).applyTo(this.#memory));
	}

	subtract(value: number|Pointer) {
		const pointer = value instanceof PointerEditor ? value.#pointer : value;
		this.#emitter.emit(new WriteEvent(this.#pointer, pointer, (a,b)=> a - b).applyTo(this.#memory));
	}

	swap(other: PointerEditor) {
		this.#emitter.emit(new SwapEvent(this.#pointer, other.#pointer).applyTo(this.#memory));
	}
	
	lessThan(other: PointerEditor) {
		this.#emitter.emit(new ReadEvent(this.#pointer, other.#pointer).applyTo(this.#memory));
		return this.#memory.read(this.#pointer) < this.#memory.read(other.#pointer);
	}

	greaterThan(other: PointerEditor) {
		this.#emitter.emit(new ReadEvent(this.#pointer, other.#pointer).applyTo(this.#memory));
		return this.#memory.read(this.#pointer) > this.#memory.read(other.#pointer);
	}

	lessThanOrEqualTo(other: PointerEditor) {
		this.#emitter.emit(new ReadEvent(this.#pointer, other.#pointer).applyTo(this.#memory));
		return this.#memory.read(this.#pointer)! <= other.#memory.read(other.#pointer)!;
	}

	greaterThanOrEqualTo(other: PointerEditor) {
		this.#emitter.emit(new ReadEvent(this.#pointer, other.#pointer).applyTo(this.#memory));
		return this.#memory.read(this.#pointer)! >= other.#memory.read(other.#pointer)!;
	}

	readonly #memory: Memory;
	readonly #pointer: Pointer;
	readonly #emitter: CustomEmitter<EditorEvent>;
}