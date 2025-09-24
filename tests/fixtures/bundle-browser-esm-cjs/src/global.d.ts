// Declare global variables referenced in code
declare const VERSION: string;
declare const TWO: string;
declare const BROWSER_SUPPORTS_HTML5: boolean;
declare const PRODUCTION: boolean;

declare module "*.css" {
	const classes: { [key: string]: string };
	export default classes;
}

declare module "*.less" {
	const classes: { [key: string]: string };
	export default classes;
}
