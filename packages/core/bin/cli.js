#!/usr/bin/env node

import module from "node:module";

// node@22.8.0+
if (module.enableCompileCache) {
	try {
		module.enableCompileCache();
	} catch {}
}

try {
	await import("../es/cli.js");
	// await import("../lib/cli.cjs");
} catch (e) {
	console.error(e);
	process.exit(1);
}
