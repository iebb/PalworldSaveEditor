import {useState} from "react";
import {Dropper} from "./components/libs/Dropper";
import {formatSize} from "./libs/formatSize";
import {RawEditor} from "./components/RawEditor";

function App() {
  const [content, setContent] = useState({
    json: {},
    text: undefined
  });
  const [data, setData] = useState({});
  const [fileName, setFileName] = useState("");

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
        <div className={`status-bar ${fileName? "" : " error"}`}>
          {
            fileName ? (
              <>
                <div>Palworld.TF: Editing {fileName}</div>
                <div className="space"></div>
                <div>{formatSize(data.lenDecompressed)} decompressed, {formatSize(data.lenCompressed)} compressed</div>
              </>
            ) : (
              <span>Palworld.TF: Drag a Palworld .sav file first</span>
            )
          }
        </div>
        <RawEditor
          data={data}
          content={content}
          onChange={setContent}
        />
        <div className={`status-bar small`}>
          <div><a href="https://github.com/iebb/PalworldSaveEditor/issues">issues / github</a></div>
          <div>made by ieb, based on uesave-rs</div>
          <div>some files such as "Level.sav" could be huge and would take minutes to load.</div>
        </div>
      </div>
    </Dropper>
  );
}

export default App;
