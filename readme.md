# LEGO-CP

## Install
```bash
npm install @shined/lecp
```

## Features
- rust-first
    - rspack
    - swc
    - LightningCSS
        - [CSS Modules – Lightning CSS](https://lightningcss.dev/css-modules.html#custom-naming-patterns)
		    - 只支持 rust 默认的 hash
            - 不支持 `:global`, `:local`
- esm-first
    - package.json `type: module`
    - node@22.12.0, node@20.19.0  `require(esm)`
    - esm/cjs/umd

- bundle/bundless
    - dts
    - js

- shims & polyfill
