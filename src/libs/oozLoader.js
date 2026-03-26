// Manual Oodle WASM loader - bypasses ooz-wasm's Emscripten wrapper
// which is incompatible with webpack/CRA
//
// WASM import/export mapping (from Emscripten minified build):
//   imports: a.a = _emscripten_resize_heap, a.b = _emscripten_memcpy_js
//   exports: c = memory, e = _malloc, f = _free, g = _Kraken_Decompress

const OOZ_SAFE_SPACE = 64;
let oozInstance = null;

async function initOoz() {
  if (oozInstance) return oozInstance;

  const wasmUrl = process.env.PUBLIC_URL + '/ooz.wasm';
  const response = await fetch(wasmUrl);
  const wasmBytes = await response.arrayBuffer();

  let HEAPU8;
  let memory;

  const importObject = {
    a: {
      // _emscripten_resize_heap
      a: (requestedSize) => {
        // Attempt to grow memory
        const oldSize = memory.buffer.byteLength;
        const PAGE_SIZE = 65536;
        const maxPages = 2147483648 / PAGE_SIZE;
        requestedSize = requestedSize >>> 0;
        if (requestedSize > maxPages * PAGE_SIZE) return false;
        const newPages = Math.min(maxPages, Math.max(
          (oldSize * 2) / PAGE_SIZE,
          Math.ceil(requestedSize / PAGE_SIZE)
        ));
        try {
          memory.grow(newPages - memory.buffer.byteLength / PAGE_SIZE);
          HEAPU8 = new Uint8Array(memory.buffer);
          return true;
        } catch (e) {
          return false;
        }
      },
      // _emscripten_memcpy_js
      b: (dest, src, num) => {
        HEAPU8.copyWithin(dest, src, src + num);
      },
    },
  };

  const result = await WebAssembly.instantiate(wasmBytes, importObject);
  const exports = result.instance.exports;

  memory = exports.c; // memory export
  HEAPU8 = new Uint8Array(memory.buffer);

  oozInstance = {
    _malloc: exports.e,
    _free: exports.f,
    _Kraken_Decompress: exports.g,
    get HEAPU8() { return HEAPU8; },
    refreshMemory() { HEAPU8 = new Uint8Array(memory.buffer); },
  };

  return oozInstance;
}

export async function decompress(data, rawSize) {
  const inst = await initOoz();
  inst.refreshMemory();

  const compressedPtr = inst._malloc(data.byteLength);
  inst.refreshMemory();
  inst.HEAPU8.set(data, compressedPtr);

  const decompressedPtr = inst._malloc(rawSize + OOZ_SAFE_SPACE);
  inst.refreshMemory();
  // Re-set compressed data after potential memory growth
  inst.HEAPU8.set(data, compressedPtr);

  const res = inst._Kraken_Decompress(
    compressedPtr, data.byteLength,
    decompressedPtr, rawSize
  );

  inst._free(compressedPtr);

  if (res < 0) {
    throw new Error('Oodle decompression failed (error code: ' + res + ')');
  }
  if (res !== rawSize) {
    throw new Error('Decompressed size mismatch: expected ' + rawSize + ', got ' + res);
  }

  inst.refreshMemory();
  const result = new Uint8Array(rawSize);
  result.set(inst.HEAPU8.subarray(decompressedPtr, decompressedPtr + rawSize));
  inst._free(decompressedPtr);
  return result;
}
