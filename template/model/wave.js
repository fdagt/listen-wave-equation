
class Wave {
    #samplePerSec;
    #sampleCount;
    #buffer;

    static #fmtChunkOffset = 12
    static #dataChunkOffset = 36;
    
    constructor(samplePerSec, sampleCount) {
	this.#samplePerSec = samplePerSec;
	this.#sampleCount = sampleCount;
	const fileSize = 12 + 24 + 8 + 2 * sampleCount;
	this.#buffer = new Uint8Array(fileSize);
	for (let i = 0; i < 4; ++i) {
	    this.#buffer[i] = "RIFF".charCodeAt(i);
	    this.#buffer[i + 8] = "WAVE".charCodeAt(i);
	    this.#buffer[i + Wave.#fmtChunkOffset] = "fmt ".charCodeAt(i);
	    this.#buffer[i + Wave.#dataChunkOffset] = "data".charCodeAt(i);
	}
	Wave.writeInt32(this.#buffer, 4, fileSize - 8);
	Wave.writeInt32(this.#buffer, Wave.#fmtChunkOffset + 4, 16);
	Wave.writeInt32(this.#buffer, Wave.#dataChunkOffset + 4, sampleCount * 2);
	Wave.writeInt16(this.#buffer, Wave.#fmtChunkOffset + 8, 1);
	Wave.writeInt16(this.#buffer, Wave.#fmtChunkOffset + 10, 1);
	Wave.writeInt32(this.#buffer, Wave.#fmtChunkOffset + 12, samplePerSec);
	Wave.writeInt32(this.#buffer, Wave.#fmtChunkOffset + 16, samplePerSec * 2);
	Wave.writeInt16(this.#buffer, Wave.#fmtChunkOffset + 20, 2);
	Wave.writeInt16(this.#buffer, Wave.#fmtChunkOffset + 22, 16);
    }

    get samplePerSec() {
	return this.#samplePerSec;
    }

    get sampleCount() {
	return this.#sampleCount;
    }
    
    get dataBuffer() {
	return this.#buffer.subarray(Wave.#dataChunkOffset + 8, this.#buffer.length);
    }
    
    get blob() {
	return new Blob([this.#buffer], {type: "audio/wav"});
    }
    
    static writeInt8(arr, pos, x) {
	arr[pos] = x & 0xFF;
    }

    static writeInt16(arr, pos, x) {
	arr[pos] = x & 0xFF;
	arr[pos + 1] = (x >> 8) & 0xFF;
    }

    static writeInt32(arr, pos, x) {
	arr[pos] = x & 0xFF;
	arr[pos + 1] = (x >> 8) & 0xFF;
	arr[pos + 2] = (x >> 16) & 0xFF;
	arr[pos + 3] = (x >> 24) & 0xFF;
    }
}

const samplePerSec = 32000;

function displacementToWave(u, len, progressCallback=(p)=>{}) {
    const wave = new Wave(samplePerSec, Math.floor(samplePerSec * len));
    let initialSamples = new Array(1000);
    let amplitude = 0;
    for (let i = 0; i < 1000; ++i) {
	initialSamples[i] = u(i / wave.samplePerSec);
	amplitude = Math.max(amplitude, initialSamples[i]);
    }
    amplitude *= 1.1;
    const buffer = wave.dataBuffer;
    if (amplitude === 0) {
	buffer.fill(0);
	return wave;
    }
    for (let i = 0; i < Math.min(1000, wave.sampleCount); ++i)
	Wave.writeInt16(buffer, i * 2, scaleDisplacement(initialSamples[i], amplitude))
    initialSamples = null;
    for (let i = 1000, j = 1000; i < wave.sampleCount; ++i, ++j) {
	if (j === 5000) {
	    j = 0;
	    progressCallback(i * 100 / wave.sampleCount);
	}
	Wave.writeInt16(buffer, i * 2, scaleDisplacement(u(i / wave.samplePerSec), amplitude));
    }
    progressCallback(100);
    return wave;
}

function scaleDisplacement(u, amplitude) {
    return Math.floor(32767.5 * u / amplitude - 0.5);
}
