// import React from "react";
// import Demo from "./components/Demo";
// import { sleep } from "./utils";

// export const a = (data: unknown) => console.log(data);

// export const b = async (data: unknown) => {
// 	sleep(1000);
// 	console.log(data);
// };

// export const c = async (data: unknown) => {
// 	const utils = await import("./utils");
// 	utils.sleep(1000);
// 	console.log(data);
// };

// export default () => <Demo />;

// console.log(React.version);

// enum Color {
// 	Red = 1,
// 	Green = 2,
// 	Blue = 1,
// }

let a = "xx";

function App(params: string) {
	return <div>Hello, {params}</div>;
}

const obj = {
	name: "typescript" as "typescript",
	version: 1 as 1,
};
