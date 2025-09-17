(()=>{
    "use strict";
    var __webpack_require__ = {};
    (()=>{
        __webpack_require__.n = (module)=>{
            var getter = module && module.__esModule ? ()=>module['default'] : ()=>module;
            __webpack_require__.d(getter, {
                a: getter
            });
            return getter;
        };
    })();
    (()=>{
        __webpack_require__.d = (exports1, definition)=>{
            for(var key in definition){
                if (__webpack_require__.o(definition, key) && !__webpack_require__.o(exports1, key)) {
                    Object.defineProperty(exports1, key, {
                        enumerable: true,
                        get: definition[key]
                    });
                }
            }
        };
    })();
    (()=>{
        __webpack_require__.o = (obj, prop)=>Object.prototype.hasOwnProperty.call(obj, prop);
    })();
    (()=>{
        __webpack_require__.r = (exports1)=>{
            if (typeof Symbol !== 'undefined' && Symbol.toStringTag) {
                Object.defineProperty(exports1, Symbol.toStringTag, {
                    value: 'Module'
                });
            }
            Object.defineProperty(exports1, '__esModule', {
                value: true
            });
        };
    })();
    var __webpack_exports__ = {};
    __webpack_require__.r(__webpack_exports__);
    __webpack_require__.d(__webpack_exports__, {
        asyncFn: ()=>asyncFn,
        sleep: ()=>sleep,
        "default": ()=>src
    });
    ;
    const external_React_namespaceObject = require("React");
    var external_React_default = /*#__PURE__*/ __webpack_require__.n(external_React_namespaceObject);
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
    const src = ()=>/*#__PURE__*/ external_React_default().createElement(src_components_Demo, null);
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
    exports.asyncFn = __webpack_exports__.asyncFn;
    exports["default"] = __webpack_exports__["default"];
    exports.sleep = __webpack_exports__.sleep;
    for(var __webpack_i__ in __webpack_exports__){
        if ([
            "asyncFn",
            "default",
            "sleep"
        ].indexOf(__webpack_i__) === -1) {
            exports[__webpack_i__] = __webpack_exports__[__webpack_i__];
        }
    }
    Object.defineProperty(exports, '__esModule', {
        value: true
    });
})();

//# sourceMappingURL=index.js.map