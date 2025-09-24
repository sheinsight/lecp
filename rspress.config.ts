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
	base: "/lecp/",
	themeConfig: {
		enableContentAnimation: true,
		enableAppearanceAnimation: true,

		nav: [
			{ text: "首页", link: "/" },
			{ text: "配置", link: "/config" },
			{ text: "常见问题", link: "/faq" },
			{ text: "更新日志", link: "/changelog" },
		],
		sidebar: {
			"/": [
				{ text: "介绍", link: "/guide/intro" },
				{ text: "快速开始", link: "/guide/start" },
				{
					text: "功能",
					items: [
						{ text: "构建模式", link: "/features/build-mode" },
						{ text: "Targets", link: "/features/targets" },
						{ text: "DTS", link: "/features/dts" },
						{ text: "Shims", link: "/features/shims" },
						{ text: "React", link: "/features/react" },
						{ text: "Workspace", link: "/features/workspace" },
					],
				},
				{ text: "配置", link: "/config" },
				{ text: "CLI & API", link: "/cli-api" },
				{
					text: "其它",
					items: [
						{ text: "常见问题", link: "/faq" },
						{ text: "更新日志", link: "/changelog" },
						// { text: "升级指南", link: "/upgrade" },
					],
				},
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
	// ssg: false,
});

export default config;
