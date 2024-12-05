import { defineConfig } from "./src/define-config.ts";

export default defineConfig({
	extends: "./lecp.base.config.ts",
	a: "5",
}) as unknown;
