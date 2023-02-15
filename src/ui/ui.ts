import {} from "helion/core.js";
import {} from "helion/LightTheme.js";
import {} from "helion/Panel.js";
import {} from "helion/AltSurface.js";
import {} from "helion/PanelButton.js";
import {} from "helion/Stack.js";
import {} from "helion/NavRail.js";
import {} from "helion/CircleButton.js";

import "./ui.css";

import { SortingAlgorithm } from "../algorithms/Algorithm.js";
import uiHtml from "./ui.html?raw";
import infoHtml from "./info.html?raw";
import { fa5_brands_github, fa5_solid_brush, fa5_solid_code, fa5_solid_database, fa5_solid_home, fa5_solid_info, fa5_solid_times } from "fontawesome-svgs";
import { Presentation } from "../presentation/Presentation.js";

document.body.innerHTML = uiHtml
.replace("<!-- info -->", infoHtml)
.replace("<!-- fa5_solid_code -->", fa5_solid_code)
.replace("<!-- fa5_solid_database -->", fa5_solid_database)
.replace("<!-- fa5_solid_brush -->", fa5_solid_brush)
.replace("<!-- fa5_solid_info -->", fa5_solid_info)
.replace("<!-- fa5_solid_home -->", fa5_solid_home)
.replace("<!-- fa5_solid_times -->", fa5_solid_times)
.replace("<!-- fa5_brands_github -->", fa5_brands_github)


const dialog = document.querySelector<HTMLElement>(".App_InfoDialog")!;
for (const button of document.querySelectorAll<HTMLElement>(".App_ToggleDialog")) {
	button.onclick = ()=>{
		dialog.toggleAttribute("data-opened");
	}
}

const App_Presentation_Element = document.querySelector(".App_Presentation_Element")!;
const App_Sidebar = document.querySelector(".App_Sidebar")!;

const App_Algorithms = document.querySelector(".App_Algorithms")!;
const App_Data = document.querySelector(".App_Data")!;
const App_Presentation = document.querySelector(".App_Presentation")!;
const App_Presentation_Selector = document.querySelector(".App_Presentation_Selector") as HTMLSelectElement;
const App_Presentation_Config = document.querySelector(".App_Presentation_Config")!;

// bind nav buttons to sidebar
const buttons = [...document.querySelector(".App_NavRail")!.children].slice(0, 3);
const bindSidebar = (button: Element, element: Element) => {
	button.addEventListener("click", () => {
		for (const button of buttons) button.toggleAttribute("selected", false);
		button.toggleAttribute("selected", true);
		App_Sidebar.replaceChildren(element);
	});
}

bindSidebar(buttons[0]!, App_Algorithms);
bindSidebar(buttons[1]!, App_Data);
bindSidebar(buttons[2]!, App_Presentation);
(buttons[0] as HTMLButtonElement).click();

export function setAlgorithms(algorithms: SortingAlgorithm[], runAlgorithm: (algorithm: SortingAlgorithm) => void) {
	App_Algorithms.innerHTML = "";

	for (const algorithm of algorithms) {
		const button = document.createElement("button");
		button.classList.add("helion-panel-button");
		button.innerText = algorithm.displayName;
		button.onclick = () => runAlgorithm(algorithm);
		App_Algorithms.appendChild(button);
	}

	App_Algorithms.insertBefore(document.createElement("hr"), App_Algorithms.children[1] ?? null);
}

export function setPresentations(presentations: Presentation[], onChange: (presentation: Presentation) => void) {
	App_Presentation_Selector.innerHTML = "";
	App_Presentation_Selector.append(...presentations.map(presentation=>{
		const option = document.createElement("option");
		option.innerText = presentation.displayName;
		return option;
	}));

	App_Presentation_Selector.onchange = ()=>{
		const index = App_Presentation_Selector.selectedIndex;
		onChange(presentations[index]!);
	}

	onChange(presentations[0]!);
}

export function setActivePresentation(activePresentation: Presentation) {
	App_Presentation_Config.innerHTML = "";
	App_Presentation_Config.append(activePresentation.configElement);

	App_Presentation_Element.textContent = "";
	App_Presentation_Element.appendChild(activePresentation.element);
}

export function setDataGenerators(generators: { displayName: string, run: ()=>void }[]) {
	App_Data.innerHTML = "";
	for (const generator of generators) {
		const button = document.createElement("button");
		button.classList.add("helion-panel-button");
		button.innerText = generator.displayName;
		
		button.onclick = () => {
			generator.run();
		}
		App_Data.appendChild(button);
	}
}