import { AwaitableIterable, Timer } from "open-utilities/async";
import { Duration } from "open-utilities/core";
import { Rect } from "open-utilities/geometry";
import { AnimationFrameScheduler, Canvas2DRenderer } from "open-utilities/rendering-web";
import { Color, ShapeStyle } from "open-utilities/ui";
import { Memory as Memory, MemoryPath } from "../../data/Memory.js";
import { CompareEvent, EditorEvent, CopyEvent, SwapEvent, GetEvent, SetEvent } from "../../data/MemoryEditor.js";
import { Presentation } from "../Presentation.js";
import { Scheduler } from "../Scheduler.js";
import sidebarHTML from "./sidebar.html";


export class BarChartPresentation implements Presentation {
	color = Canvas2DRenderer.sampleCSSColor(getComputedStyle(document.body).color);
	auxillaryColor = Color.fromRGBA(this.color.r, this.color.g, this.color.b, this.color.a * .7);
	readColor = Canvas2DRenderer.sampleCSSColor(getComputedStyle(document.body).getPropertyValue("--yellow"));
	writeColor = Canvas2DRenderer.sampleCSSColor(getComputedStyle(document.body).getPropertyValue("--red"));

	readonly displayName = "Bar Chart";
	readonly element = document.createElement("canvas")!;
	readonly sidebarElement = document.createElement("div")!;

	readonly #renderer = Canvas2DRenderer.fromCanvas(this.element);
	readonly #audioCtx = new AudioContext();
	readonly #eventDurationInput: HTMLInputElement;
	readonly #animationScheduler = new Scheduler<()=>any>();

	#defaultDurationInMilliseconds = 5;

	constructor() {
		this.element.style.imageRendering = "pixelated";
		this.sidebarElement.innerHTML = sidebarHTML;
		this.#eventDurationInput = this.sidebarElement.querySelector("input")!;
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

		this.#drawBars(data);

		this.#audioCtx.resume();
		const time = new Duration({ seconds: this.#audioCtx.currentTime });
		for await (const [data, change] of changes) {
			const eventDuration = this.#eventDuration();

			this.#animationScheduler.schedule(time.seconds, ()=>{
				// the sound is very piercing for event durations < 10 milliseconds,
				// so I'm scheduling it with the animation in order to throttle it.
				this.#scheduleEventSounds(this.#audioCtx.currentTime, data, change);
				this.#drawEventBars(data, change);
			});

			time.milliseconds += eventDuration.milliseconds;

			this.#animationScheduler.schedule(time.seconds, ()=>this.#drawBars(data));

			// prevent more than 5 events from being scheduled at once.
			// we need to do this to support bogo-sort.
			while (time.seconds - this.#audioCtx.currentTime > eventDuration.seconds * 5) await Timer.schedule(eventDuration);
		}
	}

	#drawEventBars(data: Memory, event: EditorEvent) {
		if (event instanceof GetEvent) this.#drawBars(data, new Map<string, Color>().set(event.path.toString(), this.readColor));
		if (event instanceof SetEvent) this.#drawBars(data, new Map<string, Color>().set(event.path.toString(), this.writeColor));
		if (event instanceof CompareEvent) this.#drawBars(data, new Map<string, Color>().set(event.lhs.toString(), this.readColor).set(event.rhs.toString(), this.readColor));

		if (event instanceof SwapEvent) this.#drawBars(data, new Map<string, Color>().set(event.lhs.toString(), this.writeColor).set(event.rhs.toString(), this.writeColor));
		if (event instanceof CopyEvent) this.#drawBars(data, new Map<string, Color>().set(event.lhs.toString(), this.writeColor).set(event.rhs.toString(), this.readColor));
	}

	#drawBars(memory: Memory, colors: Map<string, Color> = new Map) {
		const width = Math.max(...memory.arrays.map(i=>i.length));

		const arrayHeight = memory.arrays[0]!.length;
		const totalHeight = (memory.arrays.length) * arrayHeight;

		const viewport = Rect.fromCoordinates(0, 0, width, totalHeight);
		this.#renderer.setViewportRect(viewport);

		this.element.width = viewport.width;
		this.element.height = viewport.height;

		this.#renderer.clear();

		for (let p = memory.arrays.length - 1; p >= 0; p--) {
			const y = (memory.arrays.length - 1 - p) * arrayHeight;
			const array = memory.arrays[p]!;

			for (let i = 0; i < array.length; i++) {
				const x = i;
				const width = 1;
				const height = array[i]!;

				const color = colors.get(new MemoryPath(p, i).toString()) ?? (p === 0 ? this.color : this.auxillaryColor);

				this.#renderer.drawRect(Rect.fromDimensions(x, y, width, height), new ShapeStyle({fillColor: color}));
			}
		}
	}


	#scheduleEventSounds(time: number, data: Memory, event: EditorEvent) {
		const minNumber = 0;
		const maxNumber = Math.max(...data.arrays.map(i=>Math.max(...i))) || 1;

		if (event instanceof SwapEvent || event instanceof CopyEvent || event instanceof CompareEvent) {
			this.#scheduleSound(time, data.get(event.lhs)!, minNumber, maxNumber, "triangle");
			this.#scheduleSound(time, data.get(event.rhs)!, minNumber, maxNumber, "triangle");
		}

		if (event instanceof GetEvent) {
			this.#scheduleSound(time, data.get(event.path)!, minNumber, maxNumber, "triangle");
		}

		if (event instanceof SetEvent) {
			this.#scheduleSound(time, event.value, minNumber, maxNumber, "triangle");
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