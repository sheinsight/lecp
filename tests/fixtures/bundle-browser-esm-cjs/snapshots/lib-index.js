(()=>{
    "use strict";
    var __webpack_modules__ = {
        157: function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {
            __webpack_require__.r(__webpack_exports__);
            __webpack_require__.d(__webpack_exports__, {
                "default": ()=>__WEBPACK_DEFAULT_EXPORT__
            });
            const __WEBPACK_DEFAULT_EXPORT__ = {
                "title": "demo-component__title",
                "foo": "demo-component__foo"
            };
        },
        684: function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {
            __webpack_require__.r(__webpack_exports__);
            __webpack_require__.d(__webpack_exports__, {
                "default": ()=>__WEBPACK_DEFAULT_EXPORT__
            });
            const __WEBPACK_DEFAULT_EXPORT__ = {
                "title": "demo-component__title",
                "foo": "demo-component__foo"
            };
        },
        569: function(__unused_webpack_module, exports1, __webpack_require__) {
            Object.defineProperty(exports1, "__esModule", {
                value: true
            });
            Object.defineProperty(exports1, "default", {
                enumerable: true,
                get: function() {
                    return _default;
                }
            });
            const _Democss = /*#__PURE__*/ _interop_require_default(__webpack_require__(157));
            const _Demoless = /*#__PURE__*/ _interop_require_default(__webpack_require__(684));
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
        },
        193: function(__unused_webpack_module, exports1, __webpack_require__) {
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
            const _react = /*#__PURE__*/ _interop_require_default(__webpack_require__(617));
            const _Demo = /*#__PURE__*/ _interop_require_default(__webpack_require__(569));
            const _utils = __webpack_require__(745);
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
        },
        745: function(__unused_webpack_module, exports1) {
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
        },
        617: function(module) {
            module.exports = require("React");
        }
    };
    var __webpack_module_cache__ = {};
    function __webpack_require__(moduleId) {
        var cachedModule = __webpack_module_cache__[moduleId];
        if (cachedModule !== undefined) {
            return cachedModule.exports;
        }
        var module = __webpack_module_cache__[moduleId] = {
            exports: {}
        };
        __webpack_modules__[moduleId](module, module.exports, __webpack_require__);
        return module.exports;
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
    var __webpack_exports__ = __webpack_require__(193);
    var __webpack_export_target__ = exports;
    for(var __webpack_i__ in __webpack_exports__)__webpack_export_target__[__webpack_i__] = __webpack_exports__[__webpack_i__];
    if (__webpack_exports__.__esModule) Object.defineProperty(__webpack_export_target__, '__esModule', {
        value: true
    });
})();

//# sourceMappingURL=index.js.map