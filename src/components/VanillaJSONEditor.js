import { JSONEditor } from 'vanilla-jsoneditor/standalone.js'
import { useEffect, useRef } from "react";
import "./VanillaJSONEditor.css";
import { parse, stringify } from 'lossless-json'
const LosslessJSONParser = { parse, stringify }

export default function VanillaJSONEditor(_props) {
  const props = {..._props, parser: LosslessJSONParser}

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
      refEditor.current.updateProps(props);
    }
  }, [_props]);

  return <div className="vanilla-jsoneditor-react" ref={refContainer}></div>;
}
