# Shims

LECP 提供 shims 功能，实现 ESM 和 CommonJS 模块系统之间的变量兼容性支持，让开发者可以在任意模块系统中使用熟悉的语法。

## 功能概述

这对以下场景特别有用：

1. **渐进式迁移**：从 CommonJS 迁移到 ESM 的项目，允许逐步迁移代码
2. **多格式输出**：使用现代 ESM 语法编写源码，但需要同时输出 ESM 和 CJS 格式以兼容不同的消费环境
   - **ESM 产物**：可以使用 CommonJS 变量 `__dirname`、`__filename`、`require`
   - **CJS 产物**：可以使用 ESM 变量 `import.meta.url`、`import.meta.dirname`、`import.meta.filename`

## 配置选项

**类型：** `boolean | { legacy?: boolean }`

**默认值：** `false`

```ts
interface ShimsOptions {
  /**
   * 是否使用兼容模式
   * @default false
   */
  legacy?: boolean;
}
```

| 配置                   | Node.js 版本支持 | 实现方式                               |
| ---------------------- | ---------------- | -------------------------------------- |
| `legacy: false` (默认) | 20.11+           | 使用 `import.meta.{dirname, filename}` |
| `legacy: true`         | 10.12+           | 使用 `fileURLToPath` + `createRequire` |

## ESM 产物中的 CJS 兼容

在 ESM 产物中，可以直接使用 CJS 的全局变量：

### 源代码

```ts
// 在 ESM 模块中使用 CJS 变量
console.log(__dirname);   // 当前目录路径
console.log(__filename);  // 当前文件路径

// 动态导入 CJS 模块
const pkg = require('./package.json');
```

### 标准模式 (Node.js 20.11+)

```ts
// __dirname
console.log(import.meta.dirname);

// __filename
console.log(import.meta.filename);

// require
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const pkg = require('./package.json');
```

### legacy 模式 (Node.js 10.12+)

```ts
// __dirname
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// __filename
const __filename = fileURLToPath(import.meta.url);

// require
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const pkg = require('./package.json');
```

## CJS 产物中的 ESM 兼容

在 CommonJS 产物中，可以使用 ESM 的 import.meta 变量：

### 源代码

```ts
// 在 CJS 模块中使用 ESM 变量
console.log(import.meta.url);      // 文件 URL
console.log(import.meta.dirname);  // 目录路径
console.log(import.meta.filename); // 文件路径
```

### 转换结果

```ts
// import.meta.url
console.log(require('url').pathToFileURL(__filename).toString());

// import.meta.dirname
console.log(__dirname);

// import.meta.filename
console.log(__filename);
```

## 配置示例

### 启用默认 Shims

```ts
import { defineConfig } from '@shined/lecp';

export default defineConfig({
  shims: true  // 启用标准模式 (Node.js 20.11+)
});
```

### 启用兼容模式

```ts
export default defineConfig({
  shims: {
    legacy: true  // 支持较低版本 Node.js (10.12+)
  }
});
```

### 结合其他配置

```ts
export default defineConfig({
  format: [{ type: "esm" }, { type: "cjs" }],
  shims: true,
  targets: {
    node: "20.11.0"
  }
});
```

更多详细配置请参考 [配置文档](../config.md#shims)。
