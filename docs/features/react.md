# React 组件库开发

LECP 支持 React 组件库的开发，包含以下功能：

- 支持 tsx/jsx 文件编译
- 支持 css 文件编译
- 支持 css module 编译
> 默认值 `{packageName}__[local]`, 仅仅作为 namespace 使用。防止样式冲突和方便用户覆盖。

## 示例

```jsx
import { defineConfig } from '@shined/lecp';

export default defineConfig({
  react: {
    runtime: "automatic", // 可以在 tsconfig.json 中配置, lecp 会自动读取
  },
  css: {
    cssModules: true, // 开启 css modules
    lessCompile: true // 默认不推荐使用 less，仅仅作为基于 antd 二开组件的兼容支持
  }
});
```

具体配置请参考：
- [配置 react](../config.md#react)
- [配置 css](../config.md#css)


## 限制
使用 `lightningcss` 作为 css解析器， 所以不支持 `:global`, `:local`，只支持 `:global(.foo)`, `:local(.foo)` 。[详情](https://github.com/parcel-bundler/lightningcss/issues/6#issuecomment-1002148141)


```less

/* ❎ */
:global .foo{
  color: red;
}

/* ❎ */
:global .foo {
    .bar {
        color: red;
    }
}

/* ✅ */
:global(.foo) {
  color: red;
}

/* ✅ */
:global(.foo) {
    :global(.bar) {
        color: red;
    }
}

```
