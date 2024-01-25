import "./layout.css";
import "./skin.css";

import { Info } from "./info.jsx";
import { fa5_brands_github, fa5_solid_brush, fa5_solid_code, fa5_solid_database, fa5_solid_home, fa5_solid_info, fa5_solid_times } from "fontawesome-svgs";
import { SortingContext } from "../algorithms/Algorithm.js";

import { Dynamic } from "solid-js/web";
import { Show, createSignal, onMount } from "solid-js";

import { shuffle } from "../algorithms/others/shuffle.js";
import { insertionSort } from "../algorithms/inPlace/insertionSort.js";
import { bubbleSort } from "../algorithms/inPlace/bubbleSort.js";
import { selectionSort } from "../algorithms/inPlace/selectionSort.js";
import { shellSort } from "../algorithms/inPlace/shellSort.js";
import { quickSort } from "../algorithms/inPlace/quickSort.js";
import { topDownMergeSort } from "../algorithms/auxillary/topDownMergeSort.js";
import { bottomUpMergeSort } from "../algorithms/auxillary/bottomUpMergeSort.js";
import { heapSort } from "../algorithms/inPlace/heapSort.js";
import { bogoSort } from "../algorithms/others/bogoSort.js";
import { bucketSort } from "../algorithms/auxillary/bucketSort.js";
import { radixSort } from "../algorithms/auxillary/radixSort.js";
import { Memory } from "../data/Memory.js";
import { Disposable } from "open-utilities/core/memory/Disposable.js";
import { MemoryEditor } from "../data/MemoryEditor.js";
import { EditorEvent } from "../data/Events.js";
import { CustomEmitter } from "open-utilities/core/async/CustomEmitter.js";
import { BarChartPresentation } from "../presentation/BarChartPresentation.js";

class AppData {
	task = Disposable.empty;
	queue = new Set<EditorEvent>();

	memory = AppData.initMemory()
	activePresentation = new BarChartPresentation();

	static initMemory() {
		const array = new Array(100);
		for (let i = 0; i < array.length; i++) array[i] = i + 1;
		return new Memory([array]);
	}
}

const algorithms = [
	// shuffle
	{ displayName: "Shuffle", run: shuffle },
	// fast 
	{ displayName: "Quick Sort ", run: quickSort },
	{ displayName: "Heap Sort ", run: heapSort }, 
	{ displayName: "Shell Sort ", run: shellSort }, 
	// slow
	{ displayName: "Bubble Sort", run: bubbleSort }, 
	{ displayName: "Insertion Sort", run: insertionSort }, 
	{ displayName: "Selection Sort", run: selectionSort },
	// auxillary
	{ displayName: "Top Down Merge Sort", run: topDownMergeSort }, 
	{ displayName: "Bottom Up Merge Sort", run: bottomUpMergeSort }, 
	{ displayName: "Bucket Sort (k = 5)", run: bucketSort },
	{ displayName: "Radix Sort (k = 5)", run: radixSort },
	// misc
	{ displayName: "Bogo Sort", run: bogoSort },
];

const generators = [ 
	{
		displayName: "Generate Ramp",
		run() {
			const length = parseInt(prompt("Enter array length:") ?? "");
			if (!Number.isFinite(length)) return;
		
			const array = new Array(length);
			for (let i = 0; i < array.length; i++) array[i] = i + 1;
	
			return new Memory([array]);
		}
	}, 
	{
		displayName: "Generate Random",
		run() {
			const length = parseInt(prompt("Enter array length:") ?? "");
			if (!Number.isFinite(length)) return;
			
			const array = new Array(length);
			for (let i = 0; i < array.length; i++) array[i] = Math.floor(Math.random() * length);
	
			return new Memory([array]);
		}
	},
	{
		displayName: "Custom",
		run() {
			const csv = prompt("Enter comma separated values:");
			if (!csv) return;
			const parsed = csv.split(",").map(x => parseInt(x) || 0);
		
			return new Memory([parsed]);
		}
	}
];

function AlgorithmsPanel({appData}: { appData: AppData }) {
	function runAlgorithm(algorithm: (context: SortingContext)=>void) {
		// cancel old task
		appData.task.dispose();

		const memory = new Memory([appData.memory.arrays[0]!.slice()]);
		const emitter = new CustomEmitter<EditorEvent>();
		const memoryEditor = new MemoryEditor(memory, emitter);
		const arrayEditor = memoryEditor.getArray(0);

		let canceled = false;
		appData.task = new Disposable(()=>canceled = true);

		const onQueueChangeLength = new CustomEmitter<number>();
		const presentationMemory = memory.clone();

		appData.activePresentation.present(appData.memory = presentationMemory.clone(), (async function *(): AsyncIterable<[Memory, EditorEvent]> {
			appData.queue = new Set<EditorEvent>();
			
			for await (const event of emitter) {
				if (canceled) break;

				appData.queue.add(event);
				onQueueChangeLength.emit(appData.queue.size)

				presentationMemory.applyEvent(event);
				
				yield [appData.memory = presentationMemory.clone(), event];

				appData.queue.delete(event);
			}

			onQueueChangeLength.emit(appData.queue.size);
		})());

		algorithm(new SortingContext(memoryEditor, arrayEditor, onQueueChangeLength));
	}


	return <div>
		{algorithms.map((algorithm, i)=><>
			<button 
				class="InkWellButton PanelButton" 
				onClick={()=>runAlgorithm(algorithm.run)}
			>
				{algorithm.displayName}
			</button>
			<Show when={i === 0}>
				<hr />
			</Show>
		</>)}
	</div>
}

function DataPanel({appData}: { appData: AppData }) {
	return <div>
		{generators.map(generator=>(
			<button 
				class="InkWellButton PanelButton" 
				onClick={()=>{
					const data = generator.run();
					if (!data) return
					
					appData.task.dispose();
					appData.memory = data;
					appData.activePresentation.present(appData.memory.clone(), []);
				}}
			>
				{generator.displayName}
			</button>
		))}
	</div>
}


function PresentationPanel({appData}: { appData: AppData }) {
	return <div style="padding: .5em; position: relative;">
		<label style="display: block; position: relative;">
			<span>Event duration <small>(milliseconds)</small></span>
			<input 
				type="number" 
				style="width: 100%;"
				value={appData.activePresentation.eventDuration}
				onInput={e=>{
					const value = parseInt((e.target as HTMLInputElement).value);
					if (value > 0) appData.activePresentation.eventDuration = value;
				}}
			/>
		</label>
	</div>
}

export function App() {
	const [ dialogOpened, setDialogOpened ] = createSignal(false);

	const [ sidebarRoute, setSidebarRoute ] = createSignal(AlgorithmsPanel);

	const appData = new AppData();

	onMount(()=>{
		appData.activePresentation.present(appData.memory.clone(), []);
	});

	return <div class="App" style="position: absolute; inset: 0;">
		<div class="App_Presentation">
			{appData.activePresentation.element}
		</div>
		<div class="App_Sidebar container">
			<Dynamic component={sidebarRoute()} appData={appData} />
		</div>
		<div class="App_NavRail container shadow">
			<button 
				class="InkWellButton CircleButton"
				title="Algorithms" 
				innerHTML={fa5_solid_code}
				onClick={()=>setSidebarRoute(()=>AlgorithmsPanel)}
				data-selected={sidebarRoute() === AlgorithmsPanel ? "" : undefined}
			/>
			<button 
				class="InkWellButton CircleButton"
				title="Data" 
				innerHTML={fa5_solid_database}
				onClick={()=>setSidebarRoute(()=>DataPanel)}
				data-selected={sidebarRoute() === DataPanel ? "" : undefined}
			/>
			<button 
				class="InkWellButton CircleButton"
				title="Presentation" 
				innerHTML={fa5_solid_brush}
				onClick={()=>setSidebarRoute(()=>PresentationPanel)}
				data-selected={sidebarRoute() === PresentationPanel ? "" : undefined}
			/>
			<div style="flex: 1"></div>
			<button 
				class="InkWellButton CircleButton"
				title="Info" 
				innerHTML={fa5_solid_info} 
				onClick={()=>setDialogOpened(true)} 
			/>
			<a 
				class="InkWellButton CircleButton" 
				title="Github" 
				target="_blank" 
				href="https://github.com/TheCymaera/sorting-algorithm-visualizer" 
				innerHTML={fa5_brands_github}
			/>
			<a 
				class="InkWellButton CircleButton"
				title="Home"
				href="/"
				innerHTML={fa5_solid_home}
			/>
		</div>

		<div class="App_InfoDialog container" data-opened={dialogOpened() ? "" : undefined}>
			<div style="overflow: auto; height: 100%;">
				<div style="margin: auto; width: min(100%, 800px); padding: 1em;">
					<Info />
				</div>
			</div>
		
			<button 
				class="FloatingCircleButton InkWellButton" 
				title="Close" 
				style="position: absolute; right: .5em; top: .5em;" 
				innerHTML={fa5_solid_times} 
				onClick={()=>setDialogOpened(false)} 
			/>
		</div>
	</div>
}