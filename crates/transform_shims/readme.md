# @shined/swc-plugin-transform-shims


## Introduction

### ESM Shims
write `__filename` and `__dirname` in your code, and this plugin will transform them to right code in esm module.

```js
__filename
// -> node@20.11+
import.meta.filename
// or
import { fileURLToPath } from 'url'
const __filename = fileURLToPath(import.meta.url)

__dirname
// ->
import.meta.dirname
// or node@20.11+
import path from 'node:path';
const __dirname = path.dirname(__filename)
// or
import { fileURLToPath } from 'url'
const __dirname = fileURLToPath(new URL('.', import.meta.url));


```


### CommonJS Shims

write `import.meta.url` and `import.meta.dirname`,`import.meta.filename`,`import.meta.resovle`,`import.meta.main` in your code, and this plugin will transform them to right code in commonjs module.

> @swc/core@1.11.9+, swc_core@v16.5.0 支持转换。
> @swc/core@1.12.0+, swc_core@v27.0.0+ 支持 `import.meta.main`。
> 但暂不支持 `const { dirname, filename,url } = import.meta` 这种解构写法

```js
import.meta.url
// ->
require("url").pathToFileURL(__filename).toString()

import.meta.dirname
// ->
__dirname

import.meta.filename
// ->
__filename

import.meta.resolve
// ->
require.resolve()

import.meta.main
// ->
require.main === module

const { dirname: d1, filename: f1, url: u1 } = import.meta
// ->
const d1 = __dirname, f1 = __filename, u1 = require("url").pathToFileURL(__filename).toString();

```