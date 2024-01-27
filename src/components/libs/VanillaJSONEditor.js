import { JSONEditor } from 'vanilla-jsoneditor/standalone.js'
import { useEffect, useRef } from "react";
import { parse, stringify } from 'lossless-json'
const LosslessJSONParser = { parse, stringify }

export default function VanillaJSONEditor(props) {
  const refContainer = useRef(null);
  const refEditor = useRef(null);

  useEffect(() => {
    // create editor
    refEditor.current = new JSONEditor({
      target: refContainer.current,
      props: {}
    });

    return () => {
      // destroy editor
      if (refEditor.current) {
        refEditor.current.destroy();
        refEditor.current = null;
      }
    };
  }, []);

  // update props
  useEffect(() => {
    if (refEditor.current) {
      refEditor.current.updateProps({...props, parser: LosslessJSONParser});
    }
  }, [props]);

  return <div className="vanilla-jsoneditor-react" ref={refContainer}></div>;
}
