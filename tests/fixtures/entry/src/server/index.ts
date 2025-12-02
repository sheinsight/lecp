export const a = async function () {
	const b = await import("./b");
	console.log("b", b);
};
