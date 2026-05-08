# 升级指南

相比 v1，lecp v2 进行了一些改动，主要包括：

1. **包名变化**：`@shein-lego/cp` -> `@shined/lecp`

   > 内网 迁移到 外网， 统一使用 `@shined` 作为 scope

2. **配置文件名变更**：统一约定为 `lecp.config.ts`，不支持其他后缀的配置文件。**支持内容变更自动重启**

   > `.lecprc.ts` -> `lecp.config.ts`

3. **API 变更**：部分 API 进行了调整，建议查阅 [API 文档](./config.md) 以获取最新信息。
   - remove `umd`,`esm`, `cjs`
     - 改为 `format: [{ type:"umd"},{ type:"esm"},{ type:"cjs"}]`
   - `jsxRuntime` -> `react.runtime`
     > 默认值 由 `classic` 变为 优先从 tsconfig.json 获取， 其次为 `automatic`
   - `cssModules` -> `css.cssModules`
   - `lessCompile` -> `css.lessCompile`
   - `lessOptions` -> `css.lessOptions`
   - `alias` 从 tsconfig.json 获取默认值
   - 暂不支持 `workspace` 功能
     - 交给 pnpm nx turbopack 处理
   - 暂不支持 `prebuild` 预编译功能
     - 暂无 rspack 的版本的 `ncc` 工具

4. **性能优化**：使用基于 rust 工具链进行构建。
   - `webpack` -> `rspack`
     - `modifyWebpackConfig` -> `modifyRspackConfig`
     - 新增 `modifyRspackChain`
   - remove `babel`, 只支持 `swc`
   - `postcss` -> `lightningcss`
     > 所以不支持 `:global`, `:local`，只支持 `:global(.foo)`, `:local(.foo)`
   - CSS Modules 实现机制变更，**不再支持运行时动态键名访问**
     - v1 通过 postcss 在文件头部注入样式元数据，不关心调用方式，动态键名可正常运行
     - v2 通过 `swc-plugin-css-modules` 在调用处静态替换，无法处理运行时动态键名

     ```jsx
     import styles from '../styles/modal.less'

     // v1（可用，动态键名在运行时解析）
     const colors = ['', 'fail', 'success', 'fail']
     <span className={`${styles.info} ${styles[colors[submitState]]}`}>

     // v2（需改写，提前映射为静态属性访问）
     const colorClasses = ['', styles.fail, styles.success, styles.fail]
     <span className={`${styles.info} ${colorClasses[submitState]}`}>
     ```

   - dts 生成(开启 `isolatedDeclarations`)， 支持使用 `swc` 进行编译

5. **默认值变更**
   - UMD 产物默认只生成未压缩的 `index.js`，不再同时生成压缩版本。若需要压缩产物，需显式新增配置项：

     ```ts
     format: [{ type: "umd" }, { type: "umd", minify: true }];
     ```

   - `targets` 默认值升级，覆盖的浏览器/Node 版本范围缩小：

     |                     | v1               | v2                    |
     | ------------------- | ---------------- | --------------------- |
     | Web（含 ESM / UMD） | `{ chrome: 48 }` | `{ chrome: 55 }`      |
     | Node-only（纯 CJS） | `{ node: 14 }`   | `{ node: "20.11.0" }` |

     若项目需要支持旧版环境，须显式声明：

     ```ts
     targets: {
     	chrome: 48;
     }
     ```
