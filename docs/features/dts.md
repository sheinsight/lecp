# TypeScript 声明文件 (DTS)

LECP 提供强大的 TypeScript 声明文件生成功能，支持多种构建引擎和生成模式，确保类型定义与源码结构保持一致。

## 为什么需要 DTS

TypeScript 声明文件 (`.d.ts`) 提供类型信息，对于库开发者至关重要：

- **类型安全**：为用户提供准确的类型定义，减少运行时错误
- **智能提示**：IDE 可以基于类型定义提供代码补全和错误检查
- **文档作用**：类型定义本身就是最好的 API 文档

## 配置选项

LECP 的 DTS 配置灵活且功能强大：

**类型：** `boolean | DtsOptions`

**默认值：** `true` (等同于 `{ mode: "bundless", builder: "ts" }`)

```ts
interface DtsOptions {
  /**
   * 生成模式
   * - "bundle": 使用 @microsoft/api-extractor 生成单个声明文件
   * - "bundless": 保持源文件结构，生成多个声明文件
   * @default "bundless"
   */
  mode: "bundless" | "bundle";

  /**
   * 构建引擎
   * - "ts": TypeScript 编译器（功能完整，支持 d.ts.map）
   * - "swc": SWC 编译器（速度更快，但不支持 d.ts.map）
   * @default "ts"
   * @description 仅在 bundless + isolatedDeclarations 模式下可选择 swc
   */
  builder?: "ts" | "swc";
}
```

## Bundless 模式

保持源文件的目录结构，为每个源文件生成对应的声明文件：

```ts
export default defineConfig({
  dts: { mode: "bundless" }
});
```

**适用场景：**

- 库项目需要保持清晰的模块结构
- 需要与源码结构保持一致

**输出示例：**

```
src/
├── index.ts      → lib/index.d.ts
├── utils/
│   └── helper.ts → lib/utils/helper.d.ts
└── types/
    └── index.ts  → lib/types/index.d.ts
```

### 极速模式

`tsconfig.json` 配置 `"isolatedDeclarations": true` 后自动开启

```json
{
  "compilerOptions": {
    "isolatedDeclarations": true
  }
}
```

:::warning
`isolatedDeclarations` 可以显著提升 dts 构建速度，但是需要显式声明所有导出类型

详情参考 [TypeScript 官方文档 | isolatedDeclarations](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-5.html#isolated-declarations)
:::

#### 构建引擎

bundless 极速模式下有 `swc` 和 `ts` 两种构建引擎选择

- `ts`: 使用 TypeScript 编译，功能完整，支持生成 `d.ts.map`（默认）

```ts
export default defineConfig({
  dts: { mode: "bundless"，builder: "ts", }
});
```

- `swc`: 使用 SWC 编译器，速度更快，但不支持生成 `d.ts.map`

```ts
export default defineConfig({
  dts: { mode: "bundless"，builder: "swc", }
});
```

## Bundle 模式

通过 [@microsoft/api-extractor](https://api-extractor.com/) 将所有类型定义合并为单个声明文件：

```ts
export default defineConfig({
  dts: { mode: "bundle" }
});
```

更多详细配置请参考 [配置文档](../config.md#dts)。
