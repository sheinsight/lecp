# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LECP (LEGO-CP) is a Rust-first build tool for JavaScript/TypeScript projects, focusing on fast compilation and bundling using native Rust tooling (SWC, LightningCSS) with Node.js bindings. The project supports both bundled and bundless builds with multiple output formats (ESM, CJS, UMD).

## Architecture

### Hybrid Rust/Node.js Structure
- **Rust Core**: `crates/` contains the core Rust implementation
  - `bundless/`: Core bundless build logic
  - `node_binding/`: N-API bindings for Node.js integration
  - `transform_*`: SWC transform plugins for various features
- **Node.js Layer**: `packages/core/` provides the Node.js CLI and configuration API
- **Examples**: `examples/` contains demo projects showing different use cases
- **Tests**: `tests/fixtures/` contains comprehensive test scenarios

### Key Components
- **Configuration**: `lecp.config.ts` files define build configurations using `defineConfig()`
- **Build Modes**: Supports bundle (single file) and bundless (preserve structure) modes
- **TypeScript**: Dual DTS generation via SWC (fast) or TSC (complete)
- **CSS**: Integrated CSS/Less processing with modules support via LightningCSS
- **Transforms**: Custom SWC plugins for shims, extensions, and aliasing

## Development Commands

### Build & Test
```bash
# Full build (Rust + Node.js)
pnpm build

# Build Rust crates only
pnpm build:rust

# Build Node.js packages only
pnpm build:node

# Run all tests (JS + Rust)
pnpm test

# Run JavaScript tests only
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

# JavaScript linting (oxlint + biome)
pnpm lint:js

# Rust linting (clippy + rustfmt check)
pnpm lint:rust

# Format all code (biome + cargo fmt)
pnpm format
```

### Documentation
```bash
# Start docs dev server
pnpm doc:dev

# Build documentation
pnpm doc:build

# Preview built docs
pnpm doc:preview
```

## Configuration System

### Project Configuration (`lecp.config.ts`)
Projects configure builds using `defineConfig()` from `@shined/lecp`:

```typescript
import { defineConfig } from "@shined/lecp";

export default defineConfig({
  format: [{ type: "esm" }, { type: "cjs" }],
  dts: { mode: "bundless", builder: "swc" },
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
- **Bundle**: Single-file output

### DTS Generation
- **SWC**: Fast TypeScript declaration generation
- **TSC**: Full TypeScript compiler (slower but more complete)
- Both support bundless and bundled modes

## Testing Strategy

The project uses extensive fixture-based testing in `tests/fixtures/`, with each fixture representing a specific build scenario. Tests verify both output correctness and snapshot consistency.

### Running Specific Tests
Individual fixture tests can be run by navigating to the fixture directory and running the test file.

## Package Management

Uses pnpm with workspace configuration. The monorepo structure separates Rust crates from Node.js packages, with the main CLI exposed through `@shined/lecp`.

## Rust Toolchain

- **Edition**: 2024
- **MSRV**: 1.85.0
- **Key Dependencies**: SWC for transforms, tokio for async, napi for Node.js bindings
- **Build Profile**: Optimized for size in release mode (`opt-level = "s"`)