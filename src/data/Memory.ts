import { CreateArrayEvent, ReadEvent, SwapEvent, WriteEvent } from "./Events.js";

export class Memory {
	arrays: number[][];

	constructor(values: number[][]) {
		this.arrays = values.map(i=>i.slice());
	}

	clone() {
		return new Memory(this.arrays);
	}

	read(pointer: Pointer) {
		return this.arrays[pointer.array]![pointer.index]!;
	}

	write(pointer: Pointer, value: number) {
		this.arrays[pointer.array]![pointer.index] = value;
	}

	applyEvent(event: CreateArrayEvent|ReadEvent|WriteEvent|SwapEvent) {
		if (event instanceof CreateArrayEvent) {
			this.arrays.push(new Array(event.length).fill(0));
		}

		if (event instanceof ReadEvent) {
			// do nothing
		}

		if (event instanceof WriteEvent) {
			const a = this.read(event.pointer);
			const b = event.value instanceof Pointer ? this.read(event.value) : event.value;
			this.write(event.pointer, event.transformer(a, b));
		}

		if (event instanceof SwapEvent) {
			const lhs = this.read(event.lhs);
			const rhs = this.read(event.rhs);
			this.write(event.lhs, rhs);
			this.write(event.rhs, lhs);
		}
	}
}

export class Pointer {
	constructor(public array: number, public index: number) {}

	equals(other: Pointer) {
		return this.array === other.array && this.index === other.index;
	}

	toString() {
		return `${this.array}:${this.index}`;
	}
}