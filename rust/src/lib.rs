mod utils;

use std::io::Cursor;
use wasm_bindgen::prelude::*;
use uesave::{Save, StructType, Types};
use js_sys::{ArrayBuffer, Map, Uint8Array};

// This defines the Node.js Buffer type
#[wasm_bindgen]
extern "C" {
    type Buffer;

    #[wasm_bindgen(method, getter)]
    fn buffer(this: &Buffer) -> ArrayBuffer;

    #[wasm_bindgen(method, getter, js_name = byteOffset)]
    fn byte_offset(this: &Buffer) -> u32;

    #[wasm_bindgen(method, getter)]
    fn length(this: &Buffer) -> u32;
}

// When the wee_alloc feature is enabled, use wee_alloc as the global
// allocator.
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

#[wasm_bindgen]
extern {
    #[wasm_bindgen(js_namespace = console)]
    fn error(s: &str);

    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);

}

#[wasm_bindgen]
pub fn deserialize(buffer: &Buffer, map: Map) -> String {
    let mut types = Types::new();

    map.for_each(&mut |value, key| {
        types.add(key.as_string().unwrap(), StructType::Struct(value.as_string()));
    });

    let buf: Vec<u8> = Uint8Array::new_with_byte_offset_and_length(
        &buffer.buffer(),
        buffer.byte_offset(),
        buffer.length(),
    ).to_vec();

    let mut file = Cursor::new(&buf);

    let save = Save::read_with_types(&mut file, &types);
    log("save deserialized");

    if save.is_err() {
        error("Read save failed");
        let s = save.err().unwrap().to_string();
        error(&s);
        panic!("{}", s);
    }

    log("serializing to json");
    let encoded = serde_json::to_string(&save.unwrap());
    if encoded.is_err() {
        panic!("{}", encoded.err().unwrap().to_string());
    }

    return encoded.unwrap();
}

#[wasm_bindgen]
pub fn serialize(json: String) -> Vec<u8> {
    let decoded: Save = serde_json::from_str(&json).unwrap();
    let mut writer: Vec<u8> = Vec::new();
    let result = decoded.write(&mut writer).unwrap();
    return writer;
}
