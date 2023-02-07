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