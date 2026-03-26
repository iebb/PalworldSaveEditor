mod utils;

use std::io::Cursor;
use wasm_bindgen::prelude::*;
use uesave::{Save, SaveReader};
use js_sys::Map;

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn error(s: &str);

    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

#[wasm_bindgen]
pub fn deserialize(data: &[u8], _map: Map) -> Result<String, JsValue> {
    let save = SaveReader::new()
        .error_to_raw(true)
        .read(Cursor::new(data))
        .map_err(|e| {
            let msg = format!("{e}");
            error(&msg);
            JsValue::from_str(&msg)
        })?;

    log("save deserialized");
    log("serializing to json");

    serde_json::to_string(&save).map_err(|e| {
        let msg = format!("{e}");
        error(&msg);
        JsValue::from_str(&msg)
    })
}

#[wasm_bindgen]
pub fn serialize(json: &str) -> Result<Vec<u8>, JsValue> {
    let save: Save = serde_json::from_str(json).map_err(|e| {
        let msg = format!("JSON parse error: {e}");
        error(&msg);
        JsValue::from_str(&msg)
    })?;

    let mut buffer = Vec::new();
    save.write(&mut buffer).map_err(|e| {
        let msg = format!("GVAS write error: {e}");
        error(&msg);
        JsValue::from_str(&msg)
    })?;

    Ok(buffer)
}
