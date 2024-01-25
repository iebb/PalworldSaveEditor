import pako from "pako";
import {deserialize, serialize} from "./uesave";
import * as LosslessJSON from 'lossless-json'
import {Serializer} from "./Serializer";

const { saveAs } = require("file-saver");


export const analyzeFile = async (file) => {
  return new Promise((resolve) => {

    if (file !== undefined) {
      let reader = new FileReader();
      reader.onload = async (e) => {
        const serial = new Serializer(Buffer.from(reader.result));

        try {


          const lenDecompressed = serial.readInt32();
          const lenCompressed = serial.readInt32();
          const magic = serial.read(3);
          const saveType = serial.read(1);


          const data = serial.read(lenCompressed);
          let decompressed = data;

          switch (saveType[0]) {
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
            saveType,
            gvas
          });
        } catch (e) {
          alert("Is it really a Palworld Save?");
        }
      };
      reader.readAsArrayBuffer(file);
    }
  });
}


export const writeFile = async ({ magic, saveType, gvas }, filename = "save.sav") => {

  try {
    let serialized = serialize(LosslessJSON.stringify(gvas));
    const lenDecompressed = serialized.length;

    switch (saveType[0]) {
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
    buf.set(magic, 8);
    buf.set(saveType, 11);
    buf.set(serialized, 12);
    saveAs(new Blob([buf], {type: "application/binary"}), filename);
  } catch (e) {
    alert("Serialization failed. Have you accidentally removed something?");
  }

}