
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
