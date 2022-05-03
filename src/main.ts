import { EditorEvent, AddressEditor, Allocator } from "./data/MemoryEditor.js";
import { Memory } from "./data/Memory.js";
import "./ui.scss";

import { SortingAlgorithm } from "./algorithms/Algorithm.js";
import { Disposable } from "open-utilities/core";
import { BarChartPresentation } from "./presentation/BarChartPresentation/BarChartPresentation.js";
import { Presentation } from "./presentation/Presentation.js";

import * as shuffle from "./algorithms/others/shuffle.js";
import * as insertionSort from "./algorithms/in-place/insertionSort.js";
import * as bubbleSort from "./algorithms/in-place/bubbleSort.js";
import * as selectionSort from "./algorithms/in-place/selectionSort.js";
import * as shellSort from "./algorithms/in-place/shellSort.js";
import * as quickSort from "./algorithms/in-place/quickSort.js";
import * as topDownMergeSort from "./algorithms/auxillary/topDownMergeSort.js";
import * as bottomUpMergeSort from "./algorithms/auxillary/bottomUpMergeSort.js";
import * as heapSort from "./algorithms/in-place/heapSort.js";
import * as bogoSort from "./algorithms/others/bogoSort.js";
import * as bucketSort from "./algorithms/auxillary/bucketSort.js";
import { CustomEmitter, Emitter } from "open-utilities/async";

await new Promise(resolve=>window.addEventListener("load", resolve));

const main = document.querySelector(".app-main")!;
const sidebar = document.querySelector(".app-sidebar")!;

const algorithmsSidebar = document.querySelector(".app-algorithms-sidebar")!;
const dataSidebar = document.querySelector(".app-data-sidebar")!;
const presentationSidebar = document.querySelector(".app-presentations-sidebar")!;
const presentationSidebarSelector = presentationSidebar.querySelector("select")!;
const presentationSidebarContent = presentationSidebar.querySelector("stack-")!;


const app = new class {
	// for debugging
	editor?: Allocator;

	// allow running tasks to be canceled in case the user starts a new task
	// before the current one is finished.
	task: Disposable = Disposable.empty;

	memory: Memory;

	algorithms: SortingAlgorithm[] = [
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
		bogoSort,
	];

	presentations: Presentation[] = [
		new BarChartPresentation(),
	];

	activePresentation = this.presentations[0]!;

	updateAlgorithms() {
		// render sidebar
		algorithmsSidebar.innerHTML = "";
		for (const algorithm of this.algorithms) {
			const button = document.createElement("button");
			button.classList.add("panel-button");
			button.innerText = algorithm.displayName;
			button.addEventListener("click", ()=>this.runAlgorithm(algorithm));
			algorithmsSidebar.appendChild(button);
		}
	}

	updatePresentations() {
		// render sidebar
		presentationSidebarSelector.innerHTML = "";
		presentationSidebarSelector.append(...this.presentations.map(presentation=>{
			const option = document.createElement("option");
			option.innerText = presentation.displayName;
			return option;
		}));
	}

	updateActivePresentation() {
		// render sidebar & present data
		presentationSidebarContent.innerHTML = "";
		presentationSidebarContent.append(this.activePresentation.sidebarElement);

		main.innerHTML = "";
		main.appendChild(this.activePresentation.element);
		this.activePresentation.present(this.memory.clone(), []);
	}

	async runAlgorithm(algorithm: SortingAlgorithm) {
		this.task.dispose();

		const array = this.memory.arrays[0]!.slice();
		const memory = new Memory([array]);

		// create editors
		const emitter = new CustomEmitter<EditorEvent>();
		const memoryEditor = new Allocator(memory, emitter);
		const arrayEditor = memoryEditor.getArray(0);
		this.editor = memoryEditor;

		let canceled = false;
		this.task = new Disposable(()=>canceled = true);

		// create queue and run algorithm
		const queue = new Emitter.Queue(emitter);

		const presentationMemory = memory.clone();
		this.activePresentation.present(presentationMemory.clone(), (async function *(): AsyncIterable<[Memory, EditorEvent]> {
			for await (const event of queue) {
				if (canceled) return;
				event.applyTo(app.memory = presentationMemory);
				yield [presentationMemory.clone(), event];
			}
		})());

		algorithm.run(arrayEditor, memoryEditor, queue);

	}

	constructor() {
		const array = new Array(100);
		for (let i = 0; i < array.length; i++) array[i] = i + 1;
		this.memory = new Memory([array]);

		this.updateAlgorithms();
		this.updatePresentations();
		this.updateActivePresentation();
		
		presentationSidebarSelector.onchange = ()=>{
			const index = presentationSidebarSelector.selectedIndex;
			this.activePresentation = this.presentations[index]!;
			this.updateActivePresentation();
		}
	}
}


console.log(`For debugging, see "app"`)
Object.defineProperty(window, "app", {
	value: app,
});


// bind nav buttons to sidebar
const buttons = [...document.querySelector(".app-nav-rail")!.children].slice(0, 3);
const bindSidebar = (button: Element, element: Element) => {
	button.addEventListener("click", () => {
		for (const button of buttons) button.toggleAttribute("selected", false);
		button.toggleAttribute("selected", true);
		sidebar.replaceChildren(element);
	});
}

bindSidebar(buttons[0]!, algorithmsSidebar);
bindSidebar(buttons[1]!, dataSidebar);
bindSidebar(buttons[2]!, presentationSidebar);
(buttons[0] as HTMLButtonElement).click();


dataSidebar.children[0]!.addEventListener("click", ()=>{
	const length = parseInt(prompt("Enter array length:") ?? "");
	if (!Number.isFinite(length)) return;

	app.task.dispose();

	const array = new Array(length);
	for (let i = 0; i < array.length; i++) array[i] = i + 1;
	app.memory = new Memory([array]);

	app.activePresentation.present(app.memory, []);
});

dataSidebar.children[1]!.addEventListener("click", ()=>{
	const length = parseInt(prompt("Enter array length:") ?? "");
	if (!Number.isFinite(length)) return;
	
	app.task.dispose();

	const array = new Array(length);
	for (let i = 0; i < array.length; i++) array[i] = Math.floor(Math.random() * length);
	app.memory = new Memory([array]);

	app.activePresentation.present(app.memory, []);
});

dataSidebar.children[2]!.addEventListener("click", ()=>{
	const csv = prompt("Enter comma separated values:");
	if (!csv) return;
	const parsed = csv.split(",").map(x => parseInt(x) || 0);

	app.task.dispose();

	app.memory = new Memory([parsed]);

	app.activePresentation.present(app.memory, []);
});


document.querySelector<HTMLElement>("#openDialog")!.onclick =
document.querySelector<HTMLElement>("#closeDialog")!.onclick = ()=>{
	document.body.toggleAttribute("data-dialog-opened");
}

document.querySelector<HTMLElement>("#share")!.onclick = async ()=>{
	try {
		await navigator.share({
			title: document.title,
			text: (document.querySelector('meta[name="description"]') as HTMLMetaElement)?.content ?? document.title,
			url: window.location.href
		});
	} catch {
		alert("Sharing is not supported in this environment.");
	}
}