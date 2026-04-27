# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LECP (LEGO-CP) is a Rust-first build tool for JavaScript/TypeScript projects, focusing on fast compilation and bundling using native Rust tooling (SWC, LightningCSS) with Node.js bindings. The project supports both bundled and bundless builds with multiple output formats (ESM, CJS, UMD).

## Architecture

### Hybrid Rust/Node.js Structure

- **Rust Core**: `crates/` contains the core Rust implementation
  - `bundless/`: Core bundless build engine (lecp_bundless), integrates SWC transforms, isolated-dts, and CSS modules
  - `node_binding/`: N-API bindings (lecp_node_binding) for Node.js, published as `@shined/lecp-binding`
  - `transform_define/`: SWC plugin for compile-time constant replacement (like babel-plugin-transform-define)
  - `transform_extensions/`: SWC transform for module import/export path extension handling
  - `transform_shims/`: SWC plugin for ESM/CJS interop shims (__dirname, __filename, require, import.meta, etc.)
  - `transform_ts2js/`: SWC plugin for TypeScript to JavaScript conversion
- **Node.js Layer**: `packages/core/` provides the Node.js CLI and configuration API (`@shined/lecp`)
- **Examples**: `examples/` contains demo projects (demo-component, demo-sdk)
- **Tests**: `tests/fixtures/` contains comprehensive fixture-based test scenarios

Note: `transform_define`, `transform_shims`, and `transform_ts2js` have a dual-layer structure — the outer crate is a WASM plugin shell (cdylib), and the inner `transform/` subdirectory contains the actual transform logic library.

### Key Components

- **Configuration**: `lecp.config.ts` files define build configurations using `defineConfig()`
- **Build Modes**: Supports bundle (single file) and bundless (preserve structure) modes
- **TypeScript**: DTS generation via three engines: TSC (complete), SWC (fast, isolatedDeclarations only), or tsgo (fastest, requires `@typescript/native-preview`)
- **CSS**: Integrated CSS/Less processing with modules support via LightningCSS
- **Transforms**: Custom SWC plugins for shims, extensions, define, ts2js, and aliasing

## Development Commands

### Build & Test

```bash
# Full build (Rust + Node.js)
pnpm build

# Build Rust crates only
pnpm build:rust

# Build Node.js packages only
pnpm build:node

# Build native binding only
pnpm build:binding

# Run all tests (JS + Rust)
pnpm test

# Run JavaScript tests only (vitest)
pnpm test:js

# Run Rust tests only
pnpm test:rust
```

### Linting & Formatting

```bash
# Lint everything (TypeScript + JavaScript + Rust)
pnpm lint

# TypeScript type checking
pnpm lint:tsc

# JavaScript linting (oxlint + oxfmt --check)
pnpm lint:js

# Rust linting (clippy + cargo +nightly fmt --check)
pnpm lint:rust

# Format all code (oxfmt + cargo +nightly fmt)
pnpm format
```

### Documentation

```bash
# Start docs dev server (rspress)
pnpm docs:dev

# Build documentation
pnpm docs:build

# Preview built docs
pnpm docs:preview
```

## Configuration System

### Project Configuration (`lecp.config.ts`)

Projects configure builds using `defineConfig()` from `@shined/lecp`:

```typescript
import { defineConfig } from "@shined/lecp";

export default defineConfig({
  format: [{ type: "esm" }, { type: "cjs" }],
  dts: { mode: "bundless", builder: "ts" },
  css: { cssModules: true, lessCompile: true },
  react: { jsxRuntime: "automatic" },
  define: { __DEV__: JSON.stringify(true) },
  alias: { "@": "./src" },
  targets: { chrome: 55 }
});
```

### Build Formats

- **ESM**: Modern ES modules (`.js` extension)
- **CJS**: CommonJS (`.cjs` extension)
- **UMD**: Universal module format for browsers
- **Bundless**: Preserves source file structure
- **Bundle**: Single-file output (via Rspack)

### DTS Generation

Three DTS builder engines are available (`dts.builder`):

- **`"ts"`** (default): Full TypeScript compiler, most complete, supports d.ts.map
- **`"swc"`**: SWC-based, faster, requires `isolatedDeclarations: true` in tsconfig, no d.ts.map support
- **`"tsgo"`**: Go-native TypeScript compiler (tsgo), fastest, requires `@typescript/native-preview` as optional peer dependency

Builder selection logic in bundless mode:
1. `builder === "tsgo"` → tsgo CLI path
2. `tsconfig.isolatedDeclarations === true` → per-file transform (supports both swc/ts)
3. Otherwise → traditional tsc full emit

## Testing Strategy

The project uses Vitest with extensive fixture-based testing in `tests/fixtures/`. Each fixture is a self-contained mini-project with its own `lecp.config.ts`, `src/`, `package.json`, and `index.test.ts`. Tests execute builds in `beforeAll` and verify output content via snapshots and string matching.

Test fixtures cover: alias, bundle (browser/node/umd), define, dts (swc/tsc/tsgo with alias variants), entry, extensions, external-helper, react (css/less/jsx-runtime), shims, sourcemap, and svg.

### Running Specific Tests

```bash
# Run all JS tests
pnpm test:js

# Run a specific fixture test
pnpm vitest --run tests/fixtures/<fixture-name>/index.test.ts
```

## Package Management

Uses pnpm (v10) with workspace configuration and catalog for shared dependency versions. The monorepo structure separates Rust crates from Node.js packages, with the main CLI exposed through `@shined/lecp`.

- **Node.js**: `>= 20.19.0` (see `.node-version`)
- **Package Manager**: `pnpm@10`

## Rust Toolchain

- **Channel**: 1.90.0 (via `rust-toolchain.toml`)
- **Edition**: 2024
- **MSRV**: 1.85.0
- **Key Dependencies**: swc_core@64 / swc@62 for transforms, tokio for async, napi@3 for Node.js bindings
- **Build Profile**: Optimized for size in release mode (`opt-level = "s"`, `lto = true`, `codegen-units = 1`)
- **Nightly**: Required for formatting only (`cargo +nightly fmt`)
