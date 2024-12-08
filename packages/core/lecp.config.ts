import { defineConfig } from "./src/define-config.ts";

export default defineConfig({
	extends: "./lecp.base.config.ts",
	format: [
		{
			type: "esm",
			builder: "swc",
		},
	],
}) as unknown;
