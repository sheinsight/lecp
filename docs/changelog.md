# 更新日志

# 0.1.2
2025-11-25

- 🐞(bundless): 修复 transform_extensions 插件， 在非 src 文件，引入时被错误替换文件后缀
- 🐞(dts): 修复: .tsx 文件, 使用文件夹路径导入时没有正确输出 dts
- 💪(bundle): 使用 `extractSourceMap` 替换 `source-map-loader`
> rspack@1.6.0+, webpack@5.102.0+ 支持 extractSourceMap
- 🏰: bump dependencies
> rspack@1.6.4, swc_core@48

# 0.1.1
2025-10-21

- 🐞(bundless): fix shims  `fileURLToPath`, `__dirname`, `__filename ` 变量名可能已经存在导致重名问题

# 0.1.0
2025-09-18

- 💥: initial release