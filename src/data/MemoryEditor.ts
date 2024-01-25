import { CustomEmitter } from "open-utilities/core/async/mod.js";
import { CreateArrayEvent, EditorEvent, ReadEvent, WriteEvent, SwapEvent } from "./Events.js";
import { Memory, Pointer } from "./Memory.js";

export class MemoryEditor {
	readonly #emitter: CustomEmitter<EditorEvent>;

	constructor(memory: Memory, emitter: CustomEmitter<EditorEvent>) {
		this.#memory = memory;
		this.#emitter = emitter;
	}

	getArray(id: number) {
		const out: PointerEditor[] = [];
		for (let i = 0; i < this.#memory.arrays[id]!.length; i++) {
			out.push(new PointerEditor(this.#memory, new Pointer(id, i), this.#emitter));
		}
		return out as ArrayEditor;
	}

	createArray(length: number): ArrayEditor {
		this.#applyEvent(new CreateArrayEvent(length));
		return this.getArray(this.#memory.arrays.length - 1);
	}

	createVector(): VectorEditor {
		this.#applyEvent(new CreateArrayEvent(0));
		return new VectorEditor(this.#memory, this.#memory.arrays.length - 1, this.#emitter);
	}

	#applyEvent(event: EditorEvent) {
		this.#memory.applyEvent(event);
		this.#emitter.emit(event);
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
		this.#applyEvent(new WriteEvent(new Pointer(this.#id, index), value));
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

	#applyEvent(event: EditorEvent) {
		this.#memory.applyEvent(event);
		this.#emitter.emit(event);
	}
}

export class PointerEditor {
	constructor(memory: Memory, pointer: Pointer, emitter: CustomEmitter<EditorEvent>) {
		this.#memory = memory;
		this.#pointer = pointer;
		this.#emitter = emitter;
	}

	read() {
		const event = new ReadEvent([this.#pointer]);
		this.#memory.applyEvent(event);
		this.#emitter.emit(event);
		return this.#memory.read(this.#pointer);
	}

	write(value: number|PointerEditor) {
		this.#write(value);
	}

	add(value: number|PointerEditor) {
		this.#write(value, (a,b)=> a + b);
	}

	subtract(value: number|PointerEditor) {
		this.#write(value, (a,b)=> a - b);
	}

	swap(other: PointerEditor) {
		this.#applyEvent(new SwapEvent(this.#pointer, other.#pointer));
	}
	
	lessThan(other: PointerEditor) {
		return this.#compare(other, (a,b)=> a < b);
	}

	greaterThan(other: PointerEditor) {
		return this.#compare(other, (a,b)=> a > b);
	}

	lessThanOrEqualTo(other: PointerEditor) {
		return this.#compare(other, (a,b)=> a <= b);
	}

	greaterThanOrEqualTo(other: PointerEditor) {
		return this.#compare(other, (a,b)=> a >= b);
	}

	readonly #memory: Memory;
	readonly #pointer: Pointer;
	readonly #emitter: CustomEmitter<EditorEvent>;

	#write(value: number|PointerEditor, transformer?: (a: number, b: number)=>number) {
		const pointer = value instanceof PointerEditor ? value.#pointer : value;
		this.#applyEvent(new WriteEvent(this.#pointer, pointer, transformer));
	}

	#compare(other: PointerEditor, comparator: (a: number, b: number)=>boolean) {
		const lhs = this.#memory.read(this.#pointer);
		const rhs = this.#memory.read(other.#pointer);

		this.#applyEvent(new ReadEvent([this.#pointer, other.#pointer]));

		return comparator(lhs, rhs);
	}

	#applyEvent(event: EditorEvent) {
		this.#memory.applyEvent(event);
		this.#emitter.emit(event);
	}
}