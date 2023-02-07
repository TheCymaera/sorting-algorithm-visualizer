import { MemoryEditor } from "./data/MemoryEditor.js";
import { Memory } from "./data/Memory.js";
import {} from "./ui/ui.js";

import { SortingAlgorithm } from "./algorithms/Algorithm.js";
import { Disposable } from "open-utilities/core/memory/mod.js";
import { BarChartPresentation } from "./presentation/BarChartPresentation/BarChartPresentation.js";
import { Presentation } from "./presentation/Presentation.js";

import * as shuffle from "./algorithms/others/shuffle.js";
import * as insertionSort from "./algorithms/inPlace/insertionSort.js";
import * as bubbleSort from "./algorithms/inPlace/bubbleSort.js";
import * as selectionSort from "./algorithms/inPlace/selectionSort.js";
import * as shellSort from "./algorithms/inPlace/shellSort.js";
import * as quickSort from "./algorithms/inPlace/quickSort.js";
import * as topDownMergeSort from "./algorithms/auxillary/topDownMergeSort.js";
import * as bottomUpMergeSort from "./algorithms/auxillary/bottomUpMergeSort.js";
import * as heapSort from "./algorithms/inPlace/heapSort.js";
import * as bogoSort from "./algorithms/others/bogoSort.js";
import * as bucketSort from "./algorithms/auxillary/bucketSort.js";
import * as ui from "./ui/ui.js";
import { CustomEmitter } from "open-utilities/core/async/mod.js";
import { EditorEvent } from "./data/Events.js";

const generateRamp = {
	displayName: "Generate Ramp",
	run() {
		const length = parseInt(prompt("Enter array length:") ?? "");
		if (!Number.isFinite(length)) return;
	
		app.task.dispose();
	
		const array = new Array(length);
		for (let i = 0; i < array.length; i++) array[i] = i + 1;
		app.memory = new Memory([array]);
	
		app.activePresentation.present(app.memory, []);
	}
}

const generateRandom = {
	displayName: "Generate Random",
	run() {
		const length = parseInt(prompt("Enter array length:") ?? "");
		if (!Number.isFinite(length)) return;
		
		app.task.dispose();

		const array = new Array(length);
		for (let i = 0; i < array.length; i++) array[i] = Math.floor(Math.random() * length);
		app.memory = new Memory([array]);

		app.activePresentation.present(app.memory, []);
	}
}

const generateCustom = {
	displayName: "Custom",
	run() {
		const csv = prompt("Enter comma separated values:");
		if (!csv) return;
		const parsed = csv.split(",").map(x => parseInt(x) || 0);
	
		app.task.dispose();
	
		app.memory = new Memory([parsed]);
	
		app.activePresentation.present(app.memory, []);
	}
}

const app = new class {
	// for debugging
	editor?: MemoryEditor;
	queue?: Set<EditorEvent>;

	// allow running tasks to be canceled in case the user starts a new task
	// before the current one is finished.
	task: Disposable = Disposable.empty;

	memory: Memory;

	algorithms: SortingAlgorithm[] = [
		// shuffle
		shuffle,
		// fast 
		quickSort,
		heapSort, 
		shellSort, 
		// slow
		bubbleSort, 
		insertionSort, 
		selectionSort,
		// auxillary
		topDownMergeSort, 
		bottomUpMergeSort, 
		bucketSort,
		// misc
		bogoSort,
	];

	presentations: Presentation[] = [
		new BarChartPresentation(),
	];

	activePresentation = this.presentations[0]!;

	dataGenerators = [
		generateRamp,
		generateRandom,
		generateCustom,
	]

	async runAlgorithm(algorithm: SortingAlgorithm) {
		// cancel old task
		this.task.dispose();

		const memory = new Memory([this.memory.arrays[0]!.slice()]);
		const memoryEditor = new MemoryEditor(memory);
		const arrayEditor = memoryEditor.getArray(0);
		this.editor = memoryEditor;

		let canceled = false;
		this.task = new Disposable(()=>canceled = true);

		const onQueueChangeLength = new CustomEmitter<number>();
		const presentationMemory = memory.clone();
		this.activePresentation.present(presentationMemory.clone(), (async function *(): AsyncIterable<[Memory, EditorEvent]> {
			app.queue = new Set<EditorEvent>();
			
			for await (const event of memoryEditor.emitter) {
				if (canceled) break;

				app.queue.add(event);
				onQueueChangeLength.emit(app.queue.size)

				event.applyTo(app.memory = presentationMemory);
				
				yield [presentationMemory.clone(), event];

				app.queue.delete(event);
			}

			onQueueChangeLength.emit(app.queue.size);
		})());

		algorithm.run(arrayEditor, memoryEditor, onQueueChangeLength);
	}

	constructor() {
		const array = new Array(100);
		for (let i = 0; i < array.length; i++) array[i] = i + 1;
		this.memory = new Memory([array]);

		ui.setAlgorithms(this.algorithms, (algorithm)=>this.runAlgorithm(algorithm));
		ui.setPresentations(this.presentations, (presentation)=>{
			this.activePresentation = presentation;
			this.activePresentation.present(this.memory.clone(), []);
		});
		ui.setActivePresentation(this.activePresentation);
		ui.setDataGenerators(this.dataGenerators);
		this.activePresentation.present(this.memory.clone(), []);
	}
}


console.log(`For debugging, see "app"`)
Object.defineProperty(window, "app", {
	value: app,
});