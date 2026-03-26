import {saveAs} from "file-saver";
import * as LosslessJSON from 'lossless-json'
import pako from "pako";
import {Serializer} from "./Serializer";
import initUesave, {deserialize, serialize} from "./uesave/uesave_wasm";

// Recursively preserve types from original JSON when tree editor mangles them.
// The tree editor converts LosslessNumber→object/array and string "1234"→integer 1234.
function preserveTypes(original, edited) {
  // LosslessNumber got mangled by tree editor
  if (LosslessJSON.isLosslessNumber(original)) {
    if (typeof edited === 'number' || typeof edited === 'string') {
      return new LosslessJSON.LosslessNumber(String(edited));
    }
    // Tree editor converted to object/array - keep original value
    return original;
  }
  // String became number or LosslessNumber
  if (typeof original === 'string' && (typeof edited === 'number' || LosslessJSON.isLosslessNumber(edited))) {
    return String(edited);
  }
  // Recurse into objects
  if (original && edited && typeof original === 'object' && typeof edited === 'object') {
    if (Array.isArray(original) && Array.isArray(edited)) {
      return edited.map((item, i) => i < original.length ? preserveTypes(original[i], item) : item);
    }
    const result = {...edited};
    for (const key in result) {
      if (key in original) {
        result[key] = preserveTypes(original[key], result[key]);
      }
    }
    return result;
  }
  return edited;
}

// Magic byte signatures (lower 3 bytes of the magic int32 LE)
const MAGIC_PLZ = 0x5A6C50; // "PlZ" - zlib compression
const MAGIC_PLM = 0x4D6C50; // "PlM" - Oodle Mermaid compression

// Initialize WASM modules
let uesaveReady = false;
let oozDecompress = null;

const initWasm = async () => {
  if (!uesaveReady) {
    await initUesave(process.env.PUBLIC_URL + '/uesave_wasm_bg.wasm');
    uesaveReady = true;
  }
  if (!oozDecompress) {
    try {
      const ooz = await import("./oozLoader");
      oozDecompress = ooz.decompress;
    } catch (e) {
      console.warn("Oodle decompression not available, PlM format not supported:", e);
    }
  }
};

export const analyzeFile = async (file) => {
  return new Promise((resolve) => {

    if (file !== undefined) {
      let reader = new FileReader();
      reader.onload = async (e) => {
        const serial = new Serializer(Buffer.from(reader.result));

        try {
          await initWasm();

          const lenDecompressed = serial.readInt32();
          const lenCompressed = serial.readInt32();
          const magic = serial.readInt32();

          const magicBytes = magic & 0x00FFFFFF; // lower 3 bytes: PlZ or PlM
          const saveType = (magic >> 24) & 0xFF; // upper byte: compression level

          let compressedData = serial.read(lenCompressed);
          let decompressed;

          if (magicBytes === MAGIC_PLM) {
            // PlM = Oodle (Mermaid) compression
            if (!oozDecompress) {
              throw new Error("Oodle decompression (ooz-wasm) not available. PlM format saves require this module.");
            }
            decompressed = await oozDecompress(
              new Uint8Array(compressedData),
              lenDecompressed
            );
          } else {
            // PlZ = zlib compression
            // eslint-disable-next-line default-case
            switch (saveType) {
              case 0x32:
                compressedData = pako.inflate(compressedData);
              // eslint-disable-next-line no-fallthrough
              case 0x31:
                compressedData = pako.inflate(compressedData);
                break;
            }
            decompressed = compressedData;
          }


          // saveAs(new Blob([decompressed], {type: "application/binary"}), "chunk0");

          const typeMap = new Map();
          typeMap.set(
            ".worldSaveData.CharacterSaveParameterMap.Key", "Struct"
          );
          typeMap.set(
            ".worldSaveData.FoliageGridSaveDataMap.Key", "Struct",
          );
          typeMap.set(
            ".worldSaveData.FoliageGridSaveDataMap.ModelMap.InstanceDataMap.Key", "Struct",
          );
          typeMap.set(
            ".worldSaveData.MapObjectSpawnerInStageSaveData.Key", "Struct",
          );
          typeMap.set(
            ".worldSaveData.ItemContainerSaveData.Key", "Struct",
          );
          typeMap.set(
            ".worldSaveData.CharacterContainerSaveData.Key", "Struct",
          );

          console.time("deserialize");
          const data = decompressed instanceof Uint8Array ? decompressed : new Uint8Array(decompressed);
          const rawJson = deserialize(data, typeMap);
          const gvas = LosslessJSON.parse(rawJson);
          console.timeEnd("deserialize");

          resolve({
            fileName: file.name,
            lenDecompressed,
            lenCompressed,
            magic,
            gvas,
            rawJson,
          });
        } catch (e) {
          console.log(e);
          alert("Is it really a Palworld Save?");
        }
      };
      reader.readAsArrayBuffer(file);
    }
  });
}


export const writeFile = async ({ magic, gvas, rawJson }, filename = "save.sav") => {

  try {
    await initWasm();
    // Merge user edits while preserving original types
    // (tree editor converts string "1234" to integer 1234, breaking serde)
    let jsonStr;
    if (rawJson) {
      const originalGvas = LosslessJSON.parse(rawJson);
      const merged = preserveTypes(originalGvas.root.properties, gvas.root.properties);
      originalGvas.root.properties = merged;
      jsonStr = LosslessJSON.stringify(originalGvas);
    } else {
      jsonStr = LosslessJSON.stringify(gvas);
    }
    let serialized = serialize(jsonStr);
    const lenDecompressed = serialized.length;

    const magicBytes = magic & 0x00FFFFFF;

    // ooz-wasm doesn't support compression, so PlM saves are written back as PlZ (double zlib)
    // Palworld can read both formats
    let writeMagic = magic;
    if (magicBytes === MAGIC_PLM) {
      // Convert PlM -> PlZ with double zlib compression (saveType 0x32)
      writeMagic = (0x32 << 24) | MAGIC_PLZ;
    }

    const saveType = (writeMagic >> 24) & 0xFF;
    // eslint-disable-next-line default-case
    switch (saveType) {
      case 0x32:
        serialized = pako.deflate(serialized);
      // eslint-disable-next-line no-fallthrough
      case 0x31:
        serialized = pako.deflate(serialized);
        break;
    }

    const lenCompressed = serialized.length;
    const buf = new Buffer(4 + 4 + 4 + lenCompressed);

    buf.writeInt32LE(lenDecompressed);
    buf.writeInt32LE(lenCompressed, 4);
    buf.writeInt32LE(writeMagic, 8);
    buf.set(serialized, 12);
    saveAs(new Blob([buf], {type: "application/binary"}), filename);
  } catch (e) {
    console.error("Serialization error:", e);
    alert("Serialization failed. Have you accidentally removed something?");
  }

}