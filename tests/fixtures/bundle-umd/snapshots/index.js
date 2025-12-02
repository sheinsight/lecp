(function webpackUniversalModuleDefinition(root, factory) {
    if (typeof exports === 'object' && typeof module === 'object') {
        module.exports = factory(require("React"));
    } else if (typeof define === 'function' && define.amd) {
        define([
            "React"
        ], factory);
    } else if (typeof exports === 'object') {
        exports["DemoComponent"] = factory(require("React"));
    } else {
        root["DemoComponent"] = factory(root["React"]);
    }
})(self, (__rspack_external__883)=>{
    return (()=>{
        "use strict";
        var __webpack_modules__ = {
            883 (module1) {
                module1.exports = __rspack_external__883;
            }
        };
        var __webpack_module_cache__ = {};
        function __webpack_require__(moduleId) {
            var cachedModule = __webpack_module_cache__[moduleId];
            if (cachedModule !== undefined) {
                return cachedModule.exports;
            }
            var module1 = __webpack_module_cache__[moduleId] = {
                exports: {}
            };
            __webpack_modules__[moduleId](module1, module1.exports, __webpack_require__);
            return module1.exports;
        }
        (()=>{
            __webpack_require__.n = (module1)=>{
                var getter = module1 && module1.__esModule ? ()=>module1['default'] : ()=>module1;
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
        (()=>{
            __webpack_require__.r(__webpack_exports__);
            __webpack_require__.d(__webpack_exports__, {
                asyncFn: ()=>asyncFn,
                sleep: ()=>sleep,
                "default": ()=>src
            });
            var external_React_ = __webpack_require__(883);
            var external_React_default = /*#__PURE__*/ __webpack_require__.n(external_React_);
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
        })();
        return __webpack_exports__;
    })();
});

//# sourceMappingURL=index.js.map