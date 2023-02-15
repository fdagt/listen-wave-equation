
function kahanSum(oldSum, x, oldC) {
    const y = x - oldC;
    const t = oldSum + y;
    const newC = (t - oldSum) - y;
    return [t, newC];
}

function integrateLineGraphSine(points, omega) {
    let sum = 0;
    let c = 0;
    for (let i = 1; i < points.length; ++i) {
	const slope = (points[i][1] - points[i-1][1]) / (points[i][0] - points[i-1][0]);
	const x1 = slope * Math.sin(omega * points[i][0]) / omega**2;
	[sum, c] = kahanSum(sum, x1, c);
	const x2 = -slope * Math.sin(omega * points[i-1][0]) / omega**2;
	[sum, c] = kahanSum(sum, x2, c);
    }
    const x1 = points[0][1] * Math.cos(omega * points[0][0]) / omega;
    [sum, c] = kahanSum(sum, x1, c);
    const x2 = -points[points.length-1][1] * Math.cos(omega * points[points.length-1][0]) / omega;
    [sum, c] = kahanSum(sum, x2, c);
    return sum;
}

class WaveSolver {
    #damp;
    #coefAs;
    #coefBs;
    #omegas;
    
    constructor(stringLength, waveVelocity, damp, pickup, u, ut) {
	const length = Math.min(30, Math.floor(stringLength * Math.sqrt(samplePerSec**2 + (damp / Math.PI)**2) / waveVelocity));
	this.#damp = damp;
	this.#coefAs = new Array(length);
	this.#coefBs = new Array(length);
	this.#omegas = new Array(length);
	for (let i = 1; i < length; ++i) {
	    this.#omegas[i] = Math.sqrt((i * Math.PI * waveVelocity / stringLength)**2 - damp**2);
	    this.#coefAs[i] = integrateLineGraphSine(u, i * Math.PI / stringLength) * 2 / stringLength * Math.sin(i * Math.PI * pickup / stringLength);
	    this.#coefBs[i] = (damp * this.#coefAs[i] / this.#omegas[i] + integrateLineGraphSine(ut, i * Math.PI / stringLength) * 2 / (this.#omegas[i] * stringLength)) * Math.sin(i * Math.PI * pickup / stringLength);
	}
    }

    valueAt(t) {
	let u = 0;
	let c = 0;
	for (let i = this.#coefAs.length - 1; i >= 1; --i) {
	    const x1 = this.#coefAs[i] * Math.cos(this.#omegas[i] * t);
	    const y1 = x1 - c;
	    const t1 = u + y1;
	    c = (t1 - u) - y1;
	    const x2 = this.#coefBs[i] * Math.sin(this.#omegas[i] * t);
	    const y2 = x2 - c;
	    const t2 = t1 + y2;
	    c = (t2 - t1) - y2;
	    u = t2;
	}
	return u * Math.exp(- this.#damp * t);
    }

    static fundamentalFrequency(stringLength, waveVelocity, damp) {
	return Math.sqrt((waveVelocity * 0.5 / stringLength)**2 - (damp * 0.5 / Math.PI)**2);
    }
}

function halfLifeToDampingCoefficient(life) {
    return Math.log(2) / life;
}
