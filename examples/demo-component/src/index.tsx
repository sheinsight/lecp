import { produce } from "immer";
import React from "react";
import Demo from "@/components/Demo";
import { sleep } from "./utils";

console.log(produce);

export const a = (data: unknown) => console.log(data);

export const b = async (data: unknown) => {
	sleep(1000);
	console.log(data);
};

export const c = async (data: unknown) => {
	const utils = await import("./utils");
	utils.sleep(1000);
	console.log(data);
};

export default () => <Demo />;

console.log(React.version);

// "PRODUCTION": "true",
//  "VERSION": "\"5fa3b9\"",
//  "BROWSER_SUPPORTS_HTML5": "true",
//  "TWO": "\"1+1\"",
//  "typeof window": "\"object\"",
//  "process.env.NODE_ENV": "\"production\"",

if (process.env.NODE_ENV === "development") {
	console.log("dev");
}

if (process.env.NODE_ENV === "production") {
	console.log("prod");
}

console.log(VERSION);
console.log(TWO);
console.log(BROWSER_SUPPORTS_HTML5);

if (!PRODUCTION) {
	console.log("Debug info");
}

if (PRODUCTION) {
	console.log("Production log");
}

if (typeof window !== "undefined") {
	console.log("Browser environment");
}
