import Dropzone from "react-dropzone";
import {analyzeFile} from "../../libs/save";

export const Dropper = ({ children, setFile }) => {
  const openFile = async (f) => {
    const result = await analyzeFile(f);
    setFile(result);
  }


  return (
    <Dropzone
      onDropAccepted={files => openFile(files[0])}
      noClick
      multiple={false}
    >
      {({ getRootProps, getInputProps }) => (
        <div id="dropzone" {...getRootProps()}>
          <input {...getInputProps()} hidden />
          {children}
        </div>
      )}
    </Dropzone>
  )
}