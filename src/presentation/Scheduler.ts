export class Scheduler<T> {
	next(currentTime: number) {
		const out: T[] = [];
		for (const [time, item] of this.#items) {
			if (time <= currentTime) out.push(item);
		}

		return out;
	}

	schedule(time: number, item: T) {
		this.#items.push([time, item]);
	}

	unscheduleAll() {
		this.#items = [];
	}

	#items: [number, T][] = [];
}