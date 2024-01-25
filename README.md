# Palworld Save JSON Editor

[![Website](https://img.shields.io/badge/website-palworld.tf-blue)](https://palworld.tf)

> Obviously you don't want to install 100MB of dependencies / toolchains just to edit a single .sav file ...

An in-browser Palworld save file editor at https://palworld.tf/.

Based on [uesave-rs](https://github.com/trumank/uesave-rs) and [svelte-jsoneditor](https://github.com/josdejong/svelte-jsoneditor/).

## Build

The compiled Rust wasm is not included here, and you need to build it first.

```console
npm run build-rust
```

## Notes

The uesave-rs used is slightly modified so that:

* JSON Output: nil `struct_id` is automatically omitted to reduce output size.
* Built-in editing functionalities are removed, to make it compatible with WebAssembly.
* The modified code is available at [uesave-rs](https://github.com/iebb/uesave-rs) .

The JSON inside editor contains only the `$.root.properties` part.



## LICENSE
MIT

## What else?

> If you play F1 Manager games, here's another save file editor for you:
> 
> [![Website](https://img.shields.io/badge/website-save.f1setup.it-purple)](https://save.f1setup.it)