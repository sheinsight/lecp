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
})(self, (__WEBPACK_EXTERNAL_MODULE__24__)=>{
    return (()=>{
        var __webpack_modules__ = {
            656: function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {
                "use strict";
                __webpack_require__.r(__webpack_exports__);
                __webpack_require__.d(__webpack_exports__, {
                    "default": ()=>__WEBPACK_DEFAULT_EXPORT__
                });
                const __WEBPACK_DEFAULT_EXPORT__ = {
                    "title": "demo-component__title",
                    "foo": "demo-component__foo"
                };
            },
            221: function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {
                "use strict";
                __webpack_require__.r(__webpack_exports__);
                __webpack_require__.d(__webpack_exports__, {
                    "default": ()=>__WEBPACK_DEFAULT_EXPORT__
                });
                const __WEBPACK_DEFAULT_EXPORT__ = {
                    "title": "demo-component__title",
                    "foo": "demo-component__foo"
                };
            },
            866: function(module1, exports1, __webpack_require__) {
                (function(global, factory) {
                    if (true && typeof module1.exports === "object") factory(exports1, __webpack_require__(656), __webpack_require__(221));
                    else if (typeof define === "function" && define.amd) define([
                        "exports",
                        "./Demo.css",
                        "./Demo.less"
                    ], factory);
                    else if (global = typeof globalThis !== "undefined" ? globalThis : global || self) factory(global.demo = {}, global.demoCss, global.demoLess);
                })(this, function(exports1, _Democss, _Demoless) {
                    "use strict";
                    Object.defineProperty(exports1, "__esModule", {
                        value: true
                    });
                    Object.defineProperty(exports1, "default", {
                        enumerable: true,
                        get: function() {
                            return _default;
                        }
                    });
                    _Democss = /*#__PURE__*/ _interop_require_default(_Democss);
                    _Demoless = /*#__PURE__*/ _interop_require_default(_Demoless);
                    function _interop_require_default(obj) {
                        return obj && obj.__esModule ? obj : {
                            default: obj
                        };
                    }
                    console.log("styles", _Demoless.default);
                    const Demo = ()=>{
                        return /*#__PURE__*/ React.createElement("div", {
                            className: _Democss.default.container
                        }, /*#__PURE__*/ React.createElement("h1", {
                            className: _Democss.default.title
                        }, "Hello, World!"));
                    };
                    const _default = Demo;
                });
            },
            913: function(module1, exports1, __webpack_require__) {
                (function(global, factory) {
                    if (true && typeof module1.exports === "object") factory(exports1, __webpack_require__(24), __webpack_require__(866), __webpack_require__(328));
                    else if (typeof define === "function" && define.amd) define([
                        "exports",
                        "react",
                        "@/components/Demo",
                        "./utils"
                    ], factory);
                    else if (global = typeof globalThis !== "undefined" ? globalThis : global || self) factory(global.index = {}, global.react, global.demo, global.utils);
                })(this, function(exports1, _react, _Demo, _utils) {
                    "use strict";
                    Object.defineProperty(exports1, "__esModule", {
                        value: true
                    });
                    function _export(target, all) {
                        for(var name in all)Object.defineProperty(target, name, {
                            enumerable: true,
                            get: Object.getOwnPropertyDescriptor(all, name).get
                        });
                    }
                    _export(exports1, {
                        get asyncFn () {
                            return asyncFn;
                        },
                        get default () {
                            return _default;
                        },
                        get sleep () {
                            return _utils.sleep;
                        }
                    });
                    _react = /*#__PURE__*/ _interop_require_default(_react);
                    _Demo = /*#__PURE__*/ _interop_require_default(_Demo);
                    function _interop_require_default(obj) {
                        return obj && obj.__esModule ? obj : {
                            default: obj
                        };
                    }
                    const _default = ()=>/*#__PURE__*/ _react.default.createElement(_Demo.default, null);
                    const asyncFn = async ()=>{
                        await (0, _utils.sleep)(1000);
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
                });
            },
            328: function(module1, exports1) {
                (function(global, factory) {
                    if (true && typeof module1.exports === "object") factory(exports1);
                    else if (typeof define === "function" && define.amd) define([
                        "exports"
                    ], factory);
                    else if (global = typeof globalThis !== "undefined" ? globalThis : global || self) factory(global.index = {});
                })(this, function(exports1) {
                    "use strict";
                    Object.defineProperty(exports1, "__esModule", {
                        value: true
                    });
                    Object.defineProperty(exports1, "sleep", {
                        enumerable: true,
                        get: function() {
                            return sleep;
                        }
                    });
                    const sleep = (ms)=>new Promise((resolve)=>setTimeout(resolve, ms));
                });
            },
            24: function(module1) {
                "use strict";
                module1.exports = __WEBPACK_EXTERNAL_MODULE__24__;
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
            __webpack_modules__[moduleId].call(module1.exports, module1, module1.exports, __webpack_require__);
            return module1.exports;
        }
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
        var __webpack_exports__ = __webpack_require__(913);
        return __webpack_exports__;
    })();
});

//# sourceMappingURL=index.js.map