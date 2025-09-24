import colors from "picocolors";

type ColorName = Exclude<
	keyof Omit<typeof colors, "createColors">,
	"isColorSupported"
>;

// ANSI 16色 去除黑白色(black,white,whiteBright)
const COLOR_LIST: ColorName[] = [
	"red",
	"green",
	"yellow",
	"blue",
	"magenta",
	"cyan",
	"gray", // blackBright
	"redBright",
	"greenBright",
	"yellowBright",
	"blueBright",
	"magentaBright",
	"cyanBright",
];

let index = 0;
const cache: Record<string, string> = {};

export default function randomColor(pkg: string): string {
	if (!cache[pkg]) {
		const color = COLOR_LIST[index];
		cache[pkg] = colors[color](colors.bold(pkg));
		if (index === COLOR_LIST.length - 1) {
			index = 0;
		} else {
			index += 1;
		}
	}
	return cache[pkg];
}
