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
        <RawEditor
          data={data}
          content={content}
          setContent={setContent}
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
