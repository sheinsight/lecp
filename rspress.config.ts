import * as path from "node:path";
import { defineConfig, type UserConfig } from "@rspress/core";

const config: UserConfig = defineConfig({
	root: path.join(__dirname, "docs"),
	title: "LECP",
	// icon: "/rspress-icon.png",
	// logo: {
	// light: "/rspress-light-logo.png",
	// dark: "/rspress-dark-logo.png",
	// },
	themeConfig: {
		enableContentAnimation: true,
		enableAppearanceAnimation: true,

		nav: [
			{
				text: "Guide",
				link: "/guide/",
				activeMatch: "/guide/",
			},
			{
				text: "Hello world",
				link: "/hello/",
				activeMatch: "/hello/",
			},
		],
		sidebar: {
			"/": [
				{ text: "介绍", link: "/guide/intro" },
				{ text: "快速开始", link: "/guide/start" },
				{ text: "配置", link: "/config" },
			],
		},
		socialLinks: [
			{
				icon: "github",
				mode: "link",
				content: "https://github.com/sheinsight/lecp",
			},
		],
	},
	ssg: false,
});

export default config;
