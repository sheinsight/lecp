;
const sleep = (ms)=>new Promise((resolve)=>setTimeout(resolve, ms));
;
const asyncFn = async ()=>{
    await sleep(1000);
    console.log("Async function executed");
};
if (false) {}
if (true) {
    console.log("env_prod");
}
if (true) {
    console.log("Debug info");
}
if (false) {}
if (typeof window !== "undefined") {
    console.log("Browser environment");
}
export { asyncFn, sleep };

//# sourceMappingURL=index.mjs.map