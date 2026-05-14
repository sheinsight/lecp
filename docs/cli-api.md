# CLI & API

lecp 提供了命令行工具（CLI）和编程接口（API），方便用户根据需求选择合适的使用方式。

## CLI

适用于直接使用，需要配置 `lecp.config.ts` 文件。

```ts
// lecp.config.ts
import { defineConfig } from "@shined/lecp";
export default defineConfig({});
```

```bash
npx lecp
# or
npx lecp build
```

### 配置文件

lecp 配置文件统一约定为 `lecp.config.ts`。

不支持其他格式的配置文件，如 `lecp.config.js`、`lecp.config.mts`,`lecp.config.cts` 等。

> 目前通过 [jiti](https://github.com/unjs/jiti) 加载配置文件，不用关心 node esm/cjs 的语法区别，
> 例如 同时支持 `__filename`, ` import.meta.url`。

## API

适用于脚本调用或二次封装场景，无需配置文件直接传入配置。

```ts
import { build, defineConfig } from "@shined/lecp";

// config
const config = defineConfig({});

// build
const result = await build(config);
```

### Watch 模式

传入 `watch: true` 启用 watch 模式，`build` 返回 `close` 方法，可在需要时手动停止：

```ts
import { build, defineConfig } from "@shined/lecp";

const config = defineConfig({
	format: [{ type: "esm" }],
});

// 启动 watch
const { close } = await build(config, { watch: true });

// 需要停止时调用
await close();
```

### 监听自定义配置文件变化重启

使用 `watchConfig` 监听指定文件，文件变化时自动关闭旧的构建并重新启动：

```ts
import { build, defineConfig, watchConfig } from "@shined/lecp";
import { type BuildResult } from "@shined/lecp";

const config = defineConfig({
	format: [{ type: "esm" }],
});

let result: BuildResult | null = null;

const start = async () => {
	// 如果已有构建实例，先关闭
	await result?.close();

	result = await build(config, { watch: true });

	// 监听自定义配置文件变化，重启构建
	watchConfig(["custom.config.ts"], start);
};

await start();
```
