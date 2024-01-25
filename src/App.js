import {useState} from "react";
import VanillaJSONEditor from "./components/VanillaJSONEditor";
import {Dropper} from "./components/Dropper";
import * as LosslessJSON from 'lossless-json';
import { faSave } from '@fortawesome/free-regular-svg-icons'
import {formatSize} from "./libs/formatSize";
import {writeFile} from "./libs/save";

function App() {
  const [content, setContent] = useState({
    json: {},
    text: undefined
  });
  const [data, setData] = useState({});
  const [fileName, setFileName] = useState("");
  // const [version, setVersion] = useState(0);
  // const [timestamp, setTimestamp] = useState(0);


  const separator = {
    type: 'separator'
  }

  const customCopyButton = {
    type: 'button',
    onClick: async () => {
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
            alert("Invalid Content");
            return;
          }
        }
        await writeFile({
          magic: data.magic,
          gvas,
        }, data.fileName);
      } else {
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
            return [customCopyButton, separator, ...items, space]
          }}
        />
        <div className={`status-bar small`}>
          <div>
            <a href="https://github.com/iebb/PalworldSaveEditor/issues">issues</a> <a href={`https://github.com/iebb/PalworldSaveEditor/commit/${__COMMIT_HASH__}`}>github commit {__COMMIT_HASH__}</a>
          </div>
          <div>made by ieb, based on uesave-rs</div>
          <div>some files such as "Level.sav" could be huge and would take minutes to load.</div>
        </div>
      </div>
    </Dropper>
  );
}

export default App;
