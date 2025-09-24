# workspace

LECP 不内置 workspace 功能，推荐使用成熟的 monorepo 管理工具：

- **pnpm workspaces**
- **nx**
- **turborepo**

## 配置共享

LECP 通过 `extends` 配置支持配置文件的继承和复用，特别适用于 monorepo 项目中的配置管理。

### 基本用法

在子项目的 `lecp.config.ts` 中继承基础配置：

```ts
import { defineConfig } from '@shined/lecp';

export default defineConfig({
  extends: '../shared/lecp.base.config.ts',
  // 子项目特定配置
  format: [{ type: "esm" }]
});
```

### 基础配置文件示例

创建共享的基础配置文件：

```ts
// shared/lecp.base.config.ts
import { defineConfig } from '@shined/lecp';

export default defineConfig({
  targets: { chrome: 55 },
  dts: { mode: "bundless", builder: "swc" },
  sourcemap: true,
  alias: {
    '@': './src'
  },
  react: {
    jsxRuntime: "automatic"
  }
});
```

### 路径支持

`extends` 配置支持多种路径格式：

- **相对路径**：`../shared/lecp.config.ts` - 相对于当前配置文件
- **绝对路径**：`/path/to/config.ts` - 文件系统绝对路径
- **npm 包**：`@company/lecp-config` - 从 node_modules 加载

### Monorepo 结构示例

```
monorepo/
├── packages/
│   ├── ui/
│   │   └── lecp.config.ts      # extends: '../../shared/lecp.config.ts'
│   └── utils/
│       └── lecp.config.ts      # extends: '../../shared/lecp.config.ts'
├── shared/
│   └── lecp.config.ts          # 基础配置
└── package.json                # pnpm workspaces 配置
```

### 配置合并规则

继承配置时遵循以下规则：

1. 子配置会覆盖父配置的同名属性
2. 数组类型配置（如 `format`）会完全替换，不会合并
3. 对象类型配置（如 `alias`、`define`）会进行浅合并

更多详细配置说明请参考 [配置文档](../config.md#extends)。