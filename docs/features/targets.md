# 构建目标 (Targets)

LECP 通过 `targets` 配置项来指定代码的兼容目标环境，支持现代 JavaScript 语法降级。

## 基本配置

```typescript
import { defineConfig } from "@shined/lecp";

export default defineConfig({
  targets: {
    chrome: 55,
    node: "20.11.0"
  }
});
```

## 默认值

LECP 会根据构建格式自动选择合适的默认目标：

- **仅 CJS 编译场景**：`{ node: "20.11.0" }`
- **其他情况**：`{ chrome: 55 }`

推荐自行设置 target，明确项目支持的最低版本。

## 支持的目标环境

### 浏览器环境

```typescript
targets: {
  chrome: 55,      // Chrome 55+
}
```

更多值参考 [browserlist 官方文档](https://github.com/browserslist/browserslist#browsers)

### Node.js 环境

```typescript
targets: {
  node: "20.11.0"  // Node.js 20.11.0+
}
```

### 混合环境

```typescript
targets: {
  chrome: 55,
  node: "18.12.0",
  safari: 12
}
```

:::warning 注意事项
UMD 模式下同时设置 `targets.chrome` 和 `targets.node` 会导致构建失败，因为 `output.chunkFormat` 无法同时满足两个目标的要求。

**解决方案：**

- 如果确认没有代码分割，可以强制设置 `output.chunkFormat`
- **推荐做法：** UMD 仅用于 Web 平台，作为 CDN 方式引入

:::

## polyfill

LECP 不会自动引入 polyfill，只做语法降级。通常业务系统会自动引入 polyfill([core-js](https://github.com/zloirock/core-js))。

## node-polyfill

LECP 内置了一些 Node.js 的 polyfill，确保在浏览器环境中也能正常使用。对于面向浏览器和 Node.js 混合环境的库，会自动开启。

详细参考 [node-polyfill-webpack-plugin](https://github.com/Richienb/node-polyfill-webpack-plugin)

## 关键版本说明

### Chrome 55

- **新特性**：支持原生 `async/await` 语法

减少 polyfill 体积，提升运行性能

### Node.js 20.11+

- **新特性**：
  - 支持 `import.meta.dirname`
  - 支持 `import.meta.filename`

shims 实现更加小巧

### Node.js 22.12+ / 20.19+

- **新特性**：默认支持 ESM 模块

可以不输出 `cjs` 格式
