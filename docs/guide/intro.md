# 介绍

LECP 是一个高效的 NPM 包研发工具，专为 TS/JS 项目设计的现代化构建工具。
旨在让用户能够简单高效的构建出现代化，标准化，同时兼容性好的 NPM 包。

## 核心特性
- ESM first:
> 随着 `require(esm)` 在 node v22.12.0, v20.19.0 中落地，未来属于 ESM only。
> LECP 会优先考虑 ESM 的支持，但同时支持 CJS and ESM 双格式，让用户无缝从 CJS 过渡到 ESM。

- TS fist:
> 使用 ts 开发 和 生成 dts 声明文件，已经成为业内主流。
> LECP 对 ts 支持有好，此外会从 tsconfig.json 中读取配置(alias, jsx, ...), 减少用户额外配置。

- Rust first
> 使用 Rust 生态的前端工具（rspack, swc，lightningcss,...）和 充分利用 Rust 多线程能力，以获得更快的构建速度。

- 开箱即用
> LECP 将 rspack，swc，typescript 复杂的配置和最佳实践封装，同时提供简单直观的配置，满足大部分用户的需求，让用户只需关注代码本身。
> 同时提供 bundle/bundless 两种模式，支持 esm/cjs/umd多种格式，满足不同场景的需求。


## 适用场景

LECP 适合以下项目：

- 🔧 **工具包开发**: CLI 工具、SDK、工具函数库
- 📚 **组件库开发**: React 组件库，需要多格式输出
> 支持 css,jsx 文件