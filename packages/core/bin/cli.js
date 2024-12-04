#!/usr/bin/env node

import { enableCompileCache } from "node:module";

// node@22.8.0+
if (enableCompileCache) {
	try {
		enableCompileCache();
	} catch {}
}

import("../esm/cli.js");
