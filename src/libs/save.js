import {saveAs} from "file-saver";
import * as LosslessJSON from 'lossless-json'
import pako from "pako";
import {Serializer} from "./Serializer";
import {deserialize, serialize} from "./uesave";


export const analyzeFile = async (file) => {
  return new Promise((resolve) => {

    if (file !== undefined) {
      let reader = new FileReader();
      reader.onload = async (e) => {
        const serial = new Serializer(Buffer.from(reader.result));

        try {


          const lenDecompressed = serial.readInt32();
          const lenCompressed = serial.readInt32();
          const magic = serial.readInt32();


          let decompressed = serial.read(lenCompressed);


          // eslint-disable-next-line default-case
          switch (magic >> 24) {
            case 0x32:
              decompressed = pako.inflate(decompressed);
            // eslint-disable-next-line no-fallthrough
            case 0x31:
              decompressed = pako.inflate(decompressed);
              break;
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
          const gvas = LosslessJSON.parse(deserialize(decompressed, typeMap));
          console.timeEnd("deserialize");

          resolve({
            fileName: file.name,
            lenDecompressed,
            lenCompressed,
            magic,
            gvas
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


export const writeFile = async ({ magic, gvas }, filename = "save.sav") => {

  try {
    let serialized = serialize(LosslessJSON.stringify(gvas));
    const lenDecompressed = serialized.length;

    // eslint-disable-next-line default-case
    switch (magic >> 24) {
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
    buf.writeInt32LE(magic, 8);
    buf.set(serialized, 12);
    saveAs(new Blob([buf], {type: "application/binary"}), filename);
  } catch (e) {
    alert("Serialization failed. Have you accidentally removed something?");
  }

}