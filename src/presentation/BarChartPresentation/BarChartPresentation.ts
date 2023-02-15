import { AwaitableIterable } from "open-utilities/core/async/mod.js";
import { Timer } from "open-utilities/web/async/mod.js";
import { Duration } from "open-utilities/core/datetime/mod.js";
import { Matrix4, Rect, Vector2 } from "open-utilities/core/maths/mod.js";
import { ShapeStyle } from "open-utilities/core/ui/mod.js";
import { AnimationFrameScheduler, HTMLCanvas2D } from "open-utilities/web/ui/mod.js";
import { EditorEvent } from "../../data/Events.js";
import { Memory, Pointer } from "../../data/Memory.js";
import { Presentation } from "../Presentation.js";
import { Scheduler } from "../Scheduler.js";
import configHTML from "./config.html?raw";
import { } from "helion/OutlinedTextField.js";


export class BarChartPresentation implements Presentation {
	color = ()=>HTMLCanvas2D.sampleCSSColor(getComputedStyle(this.element).color);
	auxillaryColor = ()=>{
		const out = this.color();
		out.a *= .7;
		return out;
	};
	readColor = ()=>HTMLCanvas2D.sampleCSSColor(getComputedStyle(this.element).getPropertyValue("--helion-yellow"));
	writeColor = ()=>HTMLCanvas2D.sampleCSSColor(getComputedStyle(this.element).getPropertyValue("--helion-red"));
	readAndWriteColor = ()=>HTMLCanvas2D.sampleCSSColor(getComputedStyle(this.element).getPropertyValue("--helion-green"));

	readonly displayName = "Bar Chart";
	readonly element = document.createElement("canvas");
	readonly configElement = document.createElement("div");

	readonly #renderer = HTMLCanvas2D.fromCanvas(this.element);
	readonly #audioCtx = new AudioContext();
	readonly #eventDurationInput: HTMLInputElement;
	readonly #animationScheduler = new Scheduler<()=>any>();

	#defaultDurationInMilliseconds = 5;

	constructor() {
		this.element.style.backgroundColor = "transparent";
		this.element.style.imageRendering = "pixelated";
		
		this.configElement.innerHTML = configHTML;
		this.#eventDurationInput = this.configElement.querySelector("input")!;
		this.#eventDurationInput.valueAsNumber = this.#defaultDurationInMilliseconds;
		this.#eventDurationInput.placeholder = this.#defaultDurationInMilliseconds.toString();

		AnimationFrameScheduler.periodic(()=>{
			// only render the latest frame
			const frames = this.#animationScheduler.next(this.#audioCtx.currentTime);
			frames[frames.length-1]?.();
		});
	}

	#eventDuration() {
		return new Duration({milliseconds: this.#eventDurationInput.valueAsNumber || this.#defaultDurationInMilliseconds });
	}

	async present(data: Memory, changes: AwaitableIterable<[Memory, EditorEvent]>) {
		this.#animationScheduler.unscheduleAll();

		this.#drawBars(data, [], []);

		this.#audioCtx.resume();
		const time = new Duration({ seconds: this.#audioCtx.currentTime });
		for await (const [data, event] of changes) {
			const eventDuration = this.#eventDuration();

			this.#animationScheduler.schedule(time.seconds, ()=>{
				// the sound is very piercing for event durations < 10 milliseconds,
				// so I'm scheduling it with the animation in order to throttle it.
				this.#scheduleEventSounds(this.#audioCtx.currentTime, data, event);
				this.#drawBars(data, event.reads(), event.writes());
			});

			time.milliseconds += eventDuration.milliseconds;

			this.#animationScheduler.schedule(time.seconds, ()=>this.#drawBars(data, [], []));

			// prevent more than 5 events from being scheduled at once.
			// we need to do this to support bogo-sort.
			while (time.seconds - this.#audioCtx.currentTime > eventDuration.seconds * 5) await Timer.schedule(eventDuration);
		}
	}

	#drawBars(memory: Memory, reads: Pointer[], writes: Pointer[]) {
		const height = Math.max(0, ...memory.arrays.map(i=>Math.max(0, ...i)));
		const width = Math.max(...memory.arrays.map(i=>i.length));

		const totalHeight = (memory.arrays.length) * height;

		const viewport = Rect.fromCoordinates(0, 0, width, totalHeight);
		this.#renderer.setTransform(Matrix4.ortho(viewport));
		this.#renderer.setBitmapDimensions(new Vector2(viewport.width, viewport.height));

		this.#renderer.clear();

		for (let p = memory.arrays.length - 1; p >= 0; p--) {
			const y = (memory.arrays.length - 1 - p) * height;
			const array = memory.arrays[p]!;

			for (let i = 0; i < array.length; i++) {
				const x = i;
				const width = 1;
				const height = array[i]!;

				const pointer = new Pointer(p, i);
				const isRead = reads.some((other)=>pointer.equals(other));
				const isWrite = writes.some((other)=>pointer.equals(other));

				let color = (p === 0 ? this.color() : this.auxillaryColor());
				if (isRead) color = this.readColor();
				if (isWrite) color = this.writeColor();
				if (isRead && isWrite) color = this.readAndWriteColor();

				this.#renderer.drawRect(Rect.fromDimensions(x, y, width, height), new ShapeStyle({fill: color}));
			}
		}
	}

	#scheduleEventSounds(time: number, memory: Memory, event: EditorEvent) {
		const minNumber = 0;
		const maxNumber = Math.max(...memory.arrays.map(i=>Math.max(...i))) || 1;

		for (const pointer of [...event.reads(), ...event.writes()]) {
			this.#scheduleSound(time, memory.read(pointer)!, minNumber, maxNumber, "triangle");
		}
	}

	#scheduleSound(time: number, number: number, min: number, max: number, type: OscillatorType) {
		const volume = .03;
		const minHertz = 100;
		const maxHertz = 900;

		const duration = .08;
		const attack = .3;
		const decay = .6;

		const hertzPercent = (number - min) / (max - min);
		const hertz = minHertz + (maxHertz - minHertz) * hertzPercent;

		const attackStart = time;
		const attackEnd = attackStart + duration * attack;
		const decayStart = attackEnd + duration * (1 - attack - decay);
		const decayEnd = decayStart + duration * decay;
		
		const oscillator = this.#audioCtx.createOscillator();
		oscillator.type = type;
		oscillator.frequency.value = hertz;
		oscillator.start(attackStart);
		oscillator.stop(decayEnd);
		
		const envelope = this.#audioCtx.createGain();
		envelope.gain.setValueAtTime(0.0001, attackStart);
		envelope.gain.linearRampToValueAtTime(volume, attackEnd);
		envelope.gain.setValueAtTime(volume, decayStart);
		envelope.gain.exponentialRampToValueAtTime(0.0001, decayEnd);

		oscillator.connect(envelope);
		envelope.connect(this.#audioCtx.destination);
	};
}