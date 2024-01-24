import {useState} from "react";
import VanillaJSONEditor from "./components/VanillaJSONEditor";
import {Dropper} from "./components/Dropper";
import { faSave } from '@fortawesome/free-regular-svg-icons'
import './App.css';
import {writeFile} from "./libs/save";

function App() {
  const [content, setContent] = useState({
    json: {},
    text: undefined
  });
  const [data, setData] = useState({});
  const [fileName, setFileName] = useState("");


  const separator = {
    type: 'separator'
  }

  const customCopyButton = {
    type: 'button',
    onClick: async () => {
      const gvas = data.gvas;
      if (gvas && gvas.root) {
        if (content.json) {
          gvas.root.properties = content.json;
        } else if (content.text) {
          try {
            gvas.root.properties = JSON.parse(content.text);
          } catch {
            alert("Invalid Content");
            return;
          }
        }
        await writeFile({
          magic: data.magic,
          saveType: data.saveType,
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
            lenDecompressed,
            lenCompressed,
            magic,
            saveType,
            gvas
          } = data;
          console.log(lenDecompressed, lenCompressed)
          setContent({ json: gvas.root.properties });
          setData(data);
          setFileName(fileName);
        }
      }
    >
      <div className="App">
        <div style={{ padding: 4, background: fileName ? "#3883fa" : "#fa3855", color: "white", textAlign: "center", fontSize: 16 }}>
          {fileName ? `Editing ${fileName}` : `Drag a .sav file first`}
        </div>
        <VanillaJSONEditor
          content={content}
          onChange={setContent}
          onRenderMenu={(items, context) => {
            return [customCopyButton, separator, ...items, space]
          }}
        />
      </div>
    </Dropper>
  );
}

export default App;
