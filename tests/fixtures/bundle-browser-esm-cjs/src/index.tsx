import React from "react";
import Demo from "@/components/Demo";
import { sleep } from "./utils";

export { sleep };

export default () => <Demo />;

export const asyncFn = async () => {
	await sleep(1000);
	console.log("Async function executed");
};

if (process.env.NODE_ENV === "development") {
	console.log("env_dev");
}

if (process.env.NODE_ENV === "production") {
	console.log("env_prod");
}

if (!PRODUCTION) {
	console.log("Debug info");
}

if (PRODUCTION) {
	console.log("Production log");
}

if (typeof window !== "undefined") {
	console.log("Browser environment");
}
