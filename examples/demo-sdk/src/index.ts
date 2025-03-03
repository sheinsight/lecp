const dir = process.env.DIR_READ_FROM_RUNTIME;

const resolve1 = require.resolve(dir!);

const resolve2 = require.resolve("./other.js");

const resolve3 = require.resolve("./foo/" + dir + ".js");

const resolve4 = require.resolve(
	process.env.RANDOM ? "./foo/" + dir + ".js" : "./bar/" + dir + "js",
);

__dirname;
__filename;

console.log(resolve1, resolve2, resolve3, resolve4);
