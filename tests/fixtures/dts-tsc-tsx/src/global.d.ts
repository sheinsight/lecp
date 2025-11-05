// Declare global variables referenced in code
declare const __DEV__: boolean;

declare module "*.css" {
	const classes: { [key: string]: string };
	export default classes;
}

declare module "*.less" {
	const classes: { [key: string]: string };
	export default classes;
}
