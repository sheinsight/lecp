import external_React_default from "React";
;
;
const Demo = {
    "title": "demo-component__title",
    "foo": "demo-component__foo"
};
;
const components_Demo = {
    "title": "demo-component__title",
    "foo": "demo-component__foo"
};
;
console.log("styles", components_Demo);
const Demo_Demo = ()=>{
    return /*#__PURE__*/ React.createElement("div", {
        className: Demo.container
    }, /*#__PURE__*/ React.createElement("h1", {
        className: Demo.title
    }, "Hello, World!"));
};
const src_components_Demo = Demo_Demo;
;
const sleep = (ms)=>new Promise((resolve)=>setTimeout(resolve, ms));
;
const src = ()=>/*#__PURE__*/ external_React_default.createElement(src_components_Demo, null);
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
export { asyncFn, src as default, sleep };

//# sourceMappingURL=index.js.map