# @shined/swc-plugin-transform-shims


## Introduction

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