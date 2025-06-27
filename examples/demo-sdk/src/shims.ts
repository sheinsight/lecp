import path from "node:path";
import { fileURLToPath } from "node:url";

const _filename = fileURLToPath(import.meta.url);
const _dirname = path.dirname(_filename);
console.log(_dirname, _filename);

// write cjs in esm
console.log(__dirname, __filename);

// write esm in cjs
console.log(import.meta.dirname);
console.log(import.meta.filename);
console.log(import.meta.url);
// console.log(import.meta.main); // node@24.2.0 支持

const { dirname, filename, url } = import.meta;
console.log(dirname);
console.log(filename);
console.log(url);

export default {};
