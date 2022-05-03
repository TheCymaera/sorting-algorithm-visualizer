export class Memory {
	arrays: number[][];

	constructor(values: number[][]) {
		this.arrays = values.map(i=>i.slice());
	}

	clone() {
		return new Memory(this.arrays);
	}

	get(path: MemoryPath) {
		return this.arrays[path.id]![path.index]!;
	}

	write(path: MemoryPath, value: number) {
		this.arrays[path.id]![path.index] = value;
	}
}

export class MemoryPath {
	constructor(public id: number, public index: number) {}

	toString() {
		return `${this.id}:${this.index}`;
	}
}