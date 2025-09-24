# 构建模式（Bundless & Bundle）


## Bundless 模式

保持源文件的目录结构，为每个源文件生成对应的声明文件：

`esm` 和 `cjs` 两种格式会默认使用 Bundless 模式进行构建。

**适用场景：**
- 需要与源码结构保持一致，方便调试
- 希望用户按需引入模块，tree-shaking 更高效

**输出示例：**
```
src/
├── index.ts      → es/index.js.       or lib/index.cjs
├── utils/
│   └── helper.ts → es/utils/helper.js or lib/utils/helper.cjs
└── types/
    └── index.ts  → es/types/index.js  or lib/types/index.cjs
```

## Bundle 模式

将所有源文件打包成一个js文件：

`umd` 格式只能使用 Bundle 模式进行构建。
`esm` 和 `cjs` 格式也可以选择 Bundle 模式进行构建：


**适用场景：**
- umd 格式需要用于 CDN 引用
- 希望提供单一入口文件，隐藏内部模块结构

**输出示例：**
```

umd/
├── index.js
└── index.css (如果有)

```

**设置示例：**
```ts
import { defineConfig } from '@shined/lecp';

export default defineConfig({
    format: [
        { type: "umd" },                  // 只能选择 bundle 模式,无需设置
        { type: "esm", mode: "bundle" },  // 选择 bundle 模式
        { type: "cjs", mode: "bundle" }   // 选择 bundle 模式
    ],
});
```

## Other

dts 生成也支持 Bundless & Bundle 模式， 具体请参考 [DTS 文档](./dts.md)。
