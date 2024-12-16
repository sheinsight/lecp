# @shined/swc-plugin-transform-ts2js

## Reference
- `allowImportingTsExtensions`: 支持 ts 后缀的 import
  - https://www.typescriptlang.org/tsconfig/#allowImportingTsExtensions
  - tsc: https://github.com/microsoft/TypeScript/pull/59767
    - https://devblogs.microsoft.com/typescript/announcing-typescript-5-7-rc/#path-rewriting-for-relative-paths
      ts@5.7+ rewriteRelativeImportExtensions 支持编译 ts 后缀的 import

- babel: @babel/preset-typescript@7.23 -> 支持 rewriteImportExtensions
  - https://babeljs.io/docs/babel-preset-typescript#rewriteimportextensions
  - https://github.com/nicolo-ribaudo/babel/blob/v7.25.8/packages/babel-preset-typescript/src/plugin-rewrite-ts-imports.ts

- swc: 官方暂不支持
  - 社区插件: https://github.com/2fd/swc-plugin-allow-importing-ts-extensions
