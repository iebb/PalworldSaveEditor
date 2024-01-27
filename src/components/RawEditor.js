import {faFileCode, faSave} from '@fortawesome/free-regular-svg-icons'
import * as LosslessJSON from 'lossless-json';
import VanillaJSONEditor from "../components/libs/VanillaJSONEditor";
import {writeFile} from "../libs/save";
import {saveAs} from "file-saver";

export const RawEditor = ({data, content, setContent}) => {
  const getModifiedGvas = () => {
    const gvas = data.gvas;
    if (gvas && gvas.root) {
      if (content.json) {
        gvas.root.properties = {
          ...gvas.root.properties,
          ...content.json
        };
      } else if (content.text) {
        try {
          gvas.root.properties = {
            ...gvas.root.properties,
            ...LosslessJSON.parse(content.text)
          };
        } catch {
          throw new Error("Invalid Content");
        }
      }
    } else {
      throw new Error("File Not Loaded");
    }
    return gvas;
  }


  const separator = {
    type: 'separator'
  }

  const customCodeButton = {
    type: 'button',
    onClick: async () => {
      try {
        const gvas = getModifiedGvas();
        saveAs(new Blob([
          LosslessJSON.stringify(gvas)
        ], {type: "application/json"}), data.fileName + ".json");
      } catch (e) {
        alert("Invalid Content")
      }
    },
    icon: faFileCode,
    title: 'Export JSON',
  }

  const customCopyButton = {
    type: 'button',
    onClick: async () => {
      try {
        const gvas = getModifiedGvas();
        await writeFile({
          magic: data.magic,
          gvas,
        }, data.fileName);
      } catch (e) {
        alert("Invalid Content")
      }
    },
    icon: faSave,
    title: 'Export Savefile',
  }

  const space = {
    type: 'space'
  }

  return (
    <VanillaJSONEditor
      content={content}
      onChange={setContent}
      onRenderMenu={(items, context) => {
        return [customCopyButton, separator, ...items.slice(0, -1), separator, customCodeButton, space]
      }}
    />
  );
}