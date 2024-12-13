#!/usr/bin/env node

import { enableCompileCache } from "node:module";

// node@22.8.0+
if (enableCompileCache) {
	try {
		enableCompileCache();
	} catch {}
}

try {
	await import("../es/cli.js");
	// await import("../lib/cli.cjs");
} catch (e) {
	console.error(e);
	process.exit(1);
}
