import {faSave, faFileCode} from '@fortawesome/free-regular-svg-icons'
import * as LosslessJSON from 'lossless-json';
import {useState} from "react";
import {Dropper} from "./components/Dropper";
import VanillaJSONEditor from "./components/VanillaJSONEditor";
import {formatSize} from "./libs/formatSize";
import {writeFile} from "./libs/save";
import {saveAs} from "file-saver";

function App() {
  const [content, setContent] = useState({
    json: {},
    text: undefined
  });
  const [data, setData] = useState({});
  const [fileName, setFileName] = useState("");
  // const [version, setVersion] = useState(0);
  // const [timestamp, setTimestamp] = useState(0);

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
    <Dropper
      setFile={
        (data) => {
          const {
            fileName,
            gvas
          } = data;

          const rootProps = {...gvas.root.properties};

          setContent({ json: rootProps });
          setData(data);
          setFileName(fileName);
        }
      }
    >
      <div className="fullpage">
        <div className={`status-bar ${fileName ? "" : " error"}`}>
          <div>Palworld.TF</div>
          {
            fileName ? (
              <>
                <div>Editing {fileName}</div>
                <div className="space"></div>
                <div>{formatSize(data.lenDecompressed)} decompressed, {formatSize(data.lenCompressed)} compressed</div>
              </>
            ) : (
              <>
                <div>Drag a Palworld .sav file first</div>
                <div className="space"></div>
                <div>Does not work? <a href="https://github.com/iebb/PalworldSaveEditor/issues">github issues</a></div>
              </>
            )
          }
        </div>
        <VanillaJSONEditor
          content={content}
          onChange={setContent}
          onRenderMenu={(items, context) => {
            return [customCopyButton, separator, ...items.slice(0, -1), separator, customCodeButton, space]
          }}
        />
        <div className={`status-bar small bottom-status-bar`}>
          <div>
            <a href="https://github.com/iebb/PalworldSaveEditor/issues">issues</a>
          </div>
          <div>
            <a href={`https://github.com/iebb/PalworldSaveEditor/`}>github</a>
          </div>
          <div>made by ieb, based on uesave-rs</div>
          <div>
            <a href="https://www.vultr.com/?ref=9346006-8H">hosting: try vultr, $100 free credit to test out for 14d</a>
          </div>
          <div>
            commit {__COMMIT_HASH__}
          </div>
        </div>
      </div>
    </Dropper>
  );
}

export default App;
