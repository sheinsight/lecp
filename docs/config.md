# 配置

本文档详细介绍了 LECP 构建工具的所有配置选项。

## format

配置构建输出格式，支持 ESM、CJS 和 UMD 三种格式。

**类型：** `(BundlessFormat | BundleFormat)[]`

**默认值：** `[]`

```ts
import { defineConfig } from '@shined/lecp';

export default defineConfig({
  format: [
    { type: "esm" },
    { type: "umd" },
  ],
});
```

### format.type

不同格式在各模式下的支持情况：

| 格式 | Bundless 模式 | Bundle 模式 |
|------|--------------|-------------|
| ESM  | ✅ (默认)     | ✅          |
| CJS  | ✅ (默认)     | ✅          |
| UMD  | ❌            | ✅ (默认)    |

### BundlessFormat

```ts
interface BundlessFormat {
  mode?: "bundless";
  builder?: "swc";
  type: "esm" | "cjs";

  /**
   * 入口文件夹
   * @default "./src"
   */
  entry?: string;

  /**
   * 输出目录
   * @default 根据 type 决定：
   * - esm -> "./es"
   * - cjs -> "./lib"
   */
  outDir?: string;
}
```

### BundleFormat

```ts
interface BundleFormat {
  mode?: "bundle";
  builder?: "rspack";
  type: "esm" | "cjs" | "umd";

  /**
   * 入口文件
   * @default "./src/index.{ts,tsx,mts,cts,js,jsx,mjs,cjs}"
   */
  entry?: string;

  /**
   * 输出目录
   * @default 根据 type 决定：
   * - esm -> "./es"
   * - cjs -> "./lib"
   * - umd -> "./umd"
   */
  outDir?: string;

  /**
   * 包名称
   * @description 默认从 package.json 的 name 字段获取
   * UMD 模式下会转换为驼峰命名，如 react-dom -> ReactDOM
   */
  name?: string;

  /**
   * 输出文件名称
   * @default "index"
   */
  fileName?: string;

 /**
	 * 打包排除的 package
	 * @default  esm,cjs: 排除 dependencies, peerDependencies, optionalDependencies,  umd: undefined
	 * umd 无法自动获取 root， 只能手动设置。否则可以排除 peerDependencies
	 */
	externals?: RspackConfig["externals"];

  /**
   * 需要额外编译的 node_modules 包
   * @default []
   * @description 当第三方包的产物不满足当前编译目标时使用
   * 默认不编译 node_modules 下的文件
   */
  extraCompile?: string[];

  /** 自定义 Rspack 配置 */
  modifyRspackConfig?: (config: RspackConfig) => RspackConfig;

  /** 通过 rspack-chain 修改配置 */
  modifyRspackChain?: (chain: RspackChain) => void;
}
```

## targets

配置构建产物的兼容目标，影响 JavaScript 和 CSS 的编译输出。

**类型：** `Record<string, string | number>`

**默认值：**
- 仅 CJS 编译场景：`{node: "20.11.0"}`
- 其他情况：`{chrome: 55}`

**示例：**
```ts
import { defineConfig } from '@shined/lecp';

export default defineConfig({
  targets: {
    node: "22.12.0",
    // or
    chrome: 87
  },
});
```

:::warning 注意事项
UMD 模式下同时设置 `targets.chrome` 和 `targets.node` 会导致构建失败，因为 `output.chunkFormat` 无法同时满足两个目标的要求。

**解决方案：**
- 如果确认没有代码分割，可以强制设置 `output.chunkFormat`
- **推荐做法：** UMD 仅用于 Web 平台，作为 CDN 方式引入

:::

## dts

控制 TypeScript 声明文件 (.d.ts) 的生成。

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

**示例：**
```ts
import { defineConfig } from '@shined/lecp';

export default defineConfig({
  // 关闭声明文件生成
  dts: false,

  // 或者自定义配置
  dts: {
    mode: "bundle",
    builder: "ts"
  }
});
```

## sourcemap

**类型：** `boolean`

**默认值：** `true`

是否生成 sourcemap 文件。sourcemap 可以很好地帮助调试代码。

## alias

**类型：** `Record<string, string>`

**默认值：** `{}`

设置路径别名映射

支持设置相对路径，相对路径基于项目根目录。

**示例：**
```ts
import { defineConfig } from '@shined/lecp';

export default defineConfig({
  alias: {
    '@': './src',
    '@@': './compiled'
  },
});
```

## define

用于编译时替换全局变量和表达式。

**类型：** `Record<string, string>`

**默认值：** `{}`

参考 [Rspack DefinePlugin](https://rspack.rs/plugins/webpack/define-plugin) 文档

**示例：**
```ts
import { defineConfig } from '@shined/lecp';

export default defineConfig({
  define: {
    'process.env.NODE_ENV': '"production"',
    __VERSION__: '"1.0.0"',
    __DEV__: 'false',
    'typeof window': '"object"'
  },
});
```

## shims

提供跨模块系统的变量兼容性支持。

- **ESM 产物**：可使用 CJS 变量 `__dirname`、`__filename`、`require`
- **CJS 产物**：可使用 ESM 变量 `import.meta.url`、`import.meta.dirname`、`import.meta.filename`

**类型：** `boolean | { legacy?: boolean }`

**默认值：** `false`

- `shims: true`：启用默认配置
- `shims: { legacy: true }`：启用传统兼容模式

| 配置 | Node.js 版本支持 | 实现方式 |
|------|-----------------|----------|
| `legacy: false` (默认) | 20.11+ | 使用 `import.meta.{dirname, filename}` |
| `legacy: true` | 10.12+ | 使用 `fileURLToPath`,`createRequire`  |

**示例：**
```ts
import { defineConfig } from '@shined/lecp';

export default defineConfig({
  shims: {
    legacy: true  // 支持 比 20.11更低版本的 Node.js
  }
});
```

## externalHelpers

**类型：** `boolean`

**默认值：** `false`

SWC 编译时默认通过内联方式引入 helper 函数。开启此功能后，将从 `@swc/helpers` 统一引入，减少打包体积。

⚠️ **注意：** 需要在 `package.json` 的 `peerDependencies` 中添加 `@swc/helpers`。

参考文档：[SWC External Helpers](https://swc.rs/docs/configuration/compilation#jscexternalhelpers)

## react

React 相关的编译配置。

### react.jsxRuntime

**类型：** `"classic" | "automatic" | "preserve"`

**默认值：** `"automatic"`

**JSX 转换模式：**
- `"automatic"`：使用 `react/jsx-runtime`（React 17+ 推荐）
- `"classic"`：使用 `React.createElement`（传统方式）
- `"preserve"`：不对 JSX 语法进行任何转换

**示例：**
```ts
import { defineConfig } from '@shined/lecp';

export default defineConfig({
  react: {
    jsxRuntime: "classic"  // 使用新的 JSX 转换
  }
});
```

:::tip 选择建议
推荐使用 `"automatic"` 模式，无需在组件中导入 `React`

如果需要兼容React 16.x 版本，请选择 `"classic"` 模式。

:::


## css

CSS 相关的处理配置。

### css.cssModules

**类型：** `boolean | string`

**默认值：** `false`

**CSS Modules 配置：**
- `false`：关闭 CSS Modules
- `true`：使用默认命名规则 `${packageName}__[local]`
- `string`：自定义命名规则模板

**示例：**
```ts
import { defineConfig } from '@shined/lecp';

export default defineConfig({
  css: {
    cssModules: true,
    // 或自定义命名规则
    // cssModules: "[name]__[local]___[hash:base64:5]"
  }
});
```

### css.lessCompile

**类型：** `boolean`

**默认值：** `true`

在 Bundless 模式下是否编译 Less 文件为 CSS。

- `true`：编译 `.less` 文件为 `.css`
- `false`：直接复制 `.less` 文件到输出目录

### css.lessOptions

**类型：** `object`

**默认值：** `{}`

额外的 Less 编译选项，详见 [Less 官方文档](https://lesscss.org/usage/#less-options)。

### css.lightningCssOptions

**类型：** `object`

**默认值：** `{}`

额外的 Lightning CSS 配置选项，详见 [Lightning CSS 文档](https://lightningcss.dev/transpilation.html)。

## clean

**类型：** `boolean`

**默认值：** `true`

是否清理输出目录。

## exclude

**类型：** `string[]`

**默认值：** 自动忽略常见的测试文件和配置文件

指定编译时需要忽略的文件或目录，支持 [glob 模式](https://github.com/SuperchupuDev/tinyglobby)。

**示例：**
```ts
import { defineConfig } from '@shined/lecp';

export default defineConfig({
  exclude: [
    '**/*.md',          // 忽略所有 markdown 文件
    'src/dev-only/**'   // 忽略开发专用目录
  ]
});
```


## extends

**类型：** `string`

**默认值：** `undefined`

继承其他配置文件，类似于 `tsconfig.json` 的 extends 功能。适用于 monorepo 项目的配置复用场景。

**路径支持：**
- 相对路径：相对于当前配置文件
- 绝对路径：文件系统绝对路径
- npm 包：支持从 node_modules 加载

**示例：**
```ts
// 子项目配置
import { defineConfig } from '@shined/lecp';

export default defineConfig({
  extends: '../shared/lecp.base.config.ts',
  // 子项目特定配置
  format: [{ type: "esm" }]
});
```

```ts
// 基础配置文件 (lecp.base.config.ts)
import { defineConfig } from '@shined/lecp';

export default defineConfig({
  targets: { chrome: 87 },
  dts: true,
  sourcemap: true
});
```