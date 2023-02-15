
function onParameterChanged(stringLength, waveVelocity, isDamping, halfLife, fundamentalFrequency) {
    fundamentalFrequency.value = WaveSolver.fundamentalFrequency(stringLength.value - 0, waveVelocity.value - 0, isDamping.checked ? halfLifeToDampingCoefficient(halfLife.value - 0) : 0).toFixed(3);
}

function initializeParameterInput() {
    const stringLength = document.getElementById("parameter-string-length");
    const waveVelocity = document.getElementById("parameter-wave-velocity");
    const isDamping = document.getElementById("parameter-is-damping");
    const halfLife = document.getElementById("parameter-half-life");
    const fundamentalFrequency = document.getElementById("parameter-fundamental-frequency");
    onParameterChanged(stringLength, waveVelocity, isDamping, halfLife, fundamentalFrequency);
}

const svgNS = "http://www.w3.org/2000/svg";

class GraphState {
    #svg;
    #nodes;
    #edges;
    #children;
    constructor(id) {
	this.#svg = document.getElementById(id);
	this.#nodes = this.#svg.querySelector(".graph-nodes");
	this.#edges = this.#svg.querySelector(".graph-edges");
	const start = GraphState.createGraphNode("0%", "50%");
	const end = GraphState.createGraphNode("100%", "50%");
	const edge = GraphState.createGraphEdge("0%", "50%", "100%", "50%");
	this.#nodes.appendChild(start);
	this.#nodes.appendChild(end);
	this.#edges.appendChild(edge);
	this.#children = [start, edge, end];
	const state = this;
	this.#svg.addEventListener("click", (e) => {state.onClick(e);});
    }

    addNode(x, y) {
	const newNode = GraphState.createGraphNode(x, y);
	newNode.style.visibility = "hidden";
	this.#nodes.appendChild(newNode);
	const index = this.#children.findIndex((node) => {
	    if (node.tagName !== "circle")
		return false;
	    return newNode.getBoundingClientRect().left <= node.getBoundingClientRect().left;
	});
	if (index === 0 || index === -1 || newNode.getBoundingClientRect().left === this.#children[index].getBoundingClientRect().left)
	    return;
	const prevNode = this.#children[index-2];
	const nextNode = this.#children[index];
	const newPrevEdge = GraphState.createGraphEdge(prevNode.getAttribute("cx"), prevNode.getAttribute("cy"), x, y);
	const newNextEdge = GraphState.createGraphEdge(x, y, nextNode.getAttribute("cx"), nextNode.getAttribute("cy"));
	this.#edges.removeChild(this.#children[index-1]);
	this.#edges.appendChild(newPrevEdge);
	this.#edges.appendChild(newNextEdge);
	newNode.style.visibility = "visible";
	this.#children.splice(index - 1, 1, newPrevEdge, newNode, newNextEdge);
    }

    removeNode(node) {
	const index = this.#children.findIndex((x) => x === node);
	if (index === 0 || index === this.#children.length - 1 || index === -1) {
	    return;
	}
	const prevNode = this.#children[index-2];
	const nextNode = this.#children[index+2];
	const newEdge = GraphState.createGraphEdge(prevNode.getAttribute("cx"), prevNode.getAttribute("cy"), nextNode.getAttribute("cx"), nextNode.getAttribute("cy"));
	this.#edges.removeChild(this.#children[index-1]);
	this.#edges.removeChild(this.#children[index+1]);
	this.#nodes.removeChild(node);
	this.#edges.appendChild(newEdge);
	this.#children.splice(index-1, 3, newEdge);
    }

    onClick(e) {
	if (e.target.tagName === "circle")
	    this.removeNode(e.target);
	else {
	    const rect = this.#svg.getBoundingClientRect();
	    const x = (e.clientX - rect.left) / (rect.right - rect.left) * 100 + "%";
	    const y = (e.clientY - rect.top) / (rect.bottom - rect.top) * 100 + "%";
	    this.addNode(x, y);
	}
    }

    getPoints() {
	const points = new Array((this.#children.length + 1) >> 1);
	for (let i = 0; i < points.length; ++i) {
	    const node = this.#children[2 * i];
	    const x = node.getAttribute("cx");
	    const y = node.getAttribute("cy");
	    points[i] = [x.substring(0, x.length - 1) / 100, 1 - 2 * y.substring(0, y.length - 1) / 100];
	}
	return points
    }
    
    static #color = "crimson";
    static #overColor = "tomato";
    static createGraphNode(x, y) {
	const node = document.createElementNS(svgNS, 'circle');
	node.setAttribute("cx", x);
	node.setAttribute("cy", y);
	node.setAttribute("r", "1mm");
	node.setAttribute("fill", GraphState.#color)
	node.addEventListener("mouseover", (e) => {
	    e.currentTarget.setAttribute("fill", GraphState.#overColor);
	    e.currentTarget.setAttribute("r", "1.5mm");
	});
	node.addEventListener("mouseleave", (e) => {
	    e.currentTarget.setAttribute("fill", GraphState.#color);
	    e.currentTarget.setAttribute("r", "1mm");
	});
	return node;
    }

    static createGraphEdge(x1, y1, x2, y2) {
	const node = document.createElementNS(svgNS, 'line');
	node.setAttribute("x1", x1);
	node.setAttribute("y1", y1);
	node.setAttribute("x2", x2);
	node.setAttribute("y2", y2);
	node.setAttribute("stroke", GraphState.#color);
	node.setAttribute("stroke-width", "2px");
	return node;
    }
    
}


const graphStates = {};
function initializeGraph(id) {
    const state = new GraphState(id);
    graphStates[id] = state;
}

let prevObjectURL = null;
function onOutputButtonClicked() {
    const stringLength = document.getElementById("parameter-string-length").value - 0;
    const waveVelocity = document.getElementById("parameter-wave-velocity").value - 0;
    const isDamping = document.getElementById("parameter-is-damping").checked;
    const halfLife = document.getElementById("parameter-half-life").value - 0;
    const damp = halfLifeToDampingCoefficient(halfLife);
    const pickup = document.getElementById("parameter-pickup").value - 0;
    const displacement = graphStates['initial-condition-displacement-svg'].getPoints().map((p) => [p[0] * stringLength, p[1]]);
    const derivative = graphStates['initial-condition-derivative-svg'].getPoints().map((p) => [p[0] * stringLength, 500 * p[1]]);
    const progressBar = document.getElementById("calculation-progress-bar");
    const player = document.getElementById("audio-player");
    initializeProgressBar(progressBar);
    if (!isValidParameters(stringLength, waveVelocity, isDamping, damp)) {
	progressBar.classList.add("bg-danger");
	progressBar.style.width = "100%";
	alert("パラメーターがー不正です。");
	return;
    }
    progressBar.classList.add("bg-primary");
    const blob = solveWaveEquation(stringLength, waveVelocity, isDamping, damp, pickup * stringLength / 100, displacement, derivative, 3, (progress) => {
	progressBar.style.width = progress;
    });
    if (prevObjectURL !== null)
	URL.revokeObjectURL(prevObjectURL);
    prevObjectURL = URL.createObjectURL(blob);
    player.src = prevObjectURL;
    player.style.visibility = "visible";
}

function initializeProgressBar(bar) {
    bar.classList.remove("bg-danger");
    bar.classList.remove("bg-primary");
    bar.style.width = "0%";
}
