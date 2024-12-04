import pico from "picocolors";

type ColorName = Exclude<
	keyof Omit<typeof pico, "createColors">,
	"isColorSupported"
>;

// ANSI 16色 去除黑白色(black,white,whiteBright)
const colors: ColorName[] = [
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
		const color = colors[index];
		cache[pkg] = pico[color](pico.bold(pkg));
		if (index === colors.length - 1) {
			index = 0;
		} else {
			index += 1;
		}
	}
	return cache[pkg];
}
