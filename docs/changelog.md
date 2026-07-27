# 更新日志

# 0.5.2

2026-07-27

- 🐞 修复因 `UserConfigExport` 未导出, 导致在 `"declaration": true` 配置下 `lego.config.ts` 文件有ts报错
- 🐞 bundless esm 格式默认保留 `import ... with { type: 'json' }` 语法

# 0.5.1

2026-06-11

- 🐞 修复 bundless dts watch 模式下 TS5055 报错
  > outDir 产物 `.d.ts` 在重建时被模块解析重新拾取为输入文件，通过包装 `ts.System` 对编译器隐藏 outDir 下的声明文件产物；同时支持 monorepo symlink 场景的 `realpath` 回退解析

# 0.5.0

2026-05-12

- 💥 API 模式支持 watch mode，新增 `watchConfig` 配置项
  > 通过 `build({ watchConfig: { ... } })` 启用监听模式，并发布 `BuildResult` 类型
- 🐞 UMD `name` 显式传入时直接使用，不再自动做驼峰转换
  > 用户不传则回退为 `toUmdName(pkg.name)` 推导

# 0.4.0

2026-05-07

- 💥 UMD 默认 `minify` 改为 `false`，`fileName` 按 `minify` 自动推导
  > 若需要压缩产物，须显式新增配置：`{ type: "umd", minify: true }`
- 💥 支持 `tsgo` 作为 DTS 构建引擎
  > 设置 `dts.builder: "tsgo"` 启用，需安装 `@typescript/native-preview` 为可选依赖
- 🐞 修复多 format 并行构建时 `clean` 竞态导致输出被互相删除的问题
  > 将清理逻辑提升到顶层，按 outDir 去重后统一执行，再启动并行任务
- 🐞 修复 `lessCompile` 默认值 `true` 不生效的问题
- 🏰 bump dependencies
  > rspack@2.0, swc_core@64, swc@62

# 0.3.0

2025-12-26

- 💥 `target` 支持 `esXXXX: ""`
  > 例如 `es2015: ""`，表示编译到 ES2015 标准
- 🏰 bump dependencies
  > swc_core@53

# 0.2.2

2025-12-05

- 🐞 bundless 开启 clean 时可能报错
  > outDir 存在包含关系时，并发删除操作导致的竞态条件，可能出现 ENOTEMPTY

# 0.2.1

2025-12-04

- 🐞 bundless dts 配置 exclude 额外生成 dts
  > exclude 未设置生效
- 🐞 bundless dts 可能生成嵌套的目录结构
  > 设置 rootDir: entry，不受 cwd 影响
- 🏰 bump dependencies
  > rspack@1.6.6，swc_core@50

# 0.2.0

2025-12-02

- 💥 支持传入 `swcOptions`
- 🐞 修复 bundless js 未识别 `entry`
- 🐞 修复 bundless dts 未识别 `entry`
- 🏰 bump dependencies
  > rspack@1.6.5, swc_core@49

# 0.1.2

2025-11-25

- 🐞(bundless): 修复 transform_extensions 插件， 在非 src 文件，引入时被错误替换文件后缀
- 🐞(dts): 修复: .tsx 文件, 使用文件夹路径导入时没有正确输出 dts
- 💪(bundle): 使用 `extractSourceMap` 替换 `source-map-loader`
  > rspack@1.6.0+, webpack@5.102.0+ 支持 extractSourceMap
- 🏰 bump dependencies
  > rspack@1.6.4, swc_core@48

# 0.1.1

2025-10-21

- 🐞(bundless): fix shims `fileURLToPath`, `__dirname`, `__filename ` 变量名可能已经存在导致重名问题

# 0.1.0

2025-09-18

- 💥: initial release
