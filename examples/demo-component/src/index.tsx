import { produce } from "immer";
import React from "react";
import Demo from "./components/Demo";
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
