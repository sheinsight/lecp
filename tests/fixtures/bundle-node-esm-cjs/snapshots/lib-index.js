(()=>{
    "use strict";
    var __webpack_modules__ = {
        913: function(__unused_webpack_module, exports1, __webpack_require__) {
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
                get sleep () {
                    return _utils.sleep;
                }
            });
            const _utils = __webpack_require__(328);
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
        328: function(__unused_webpack_module, exports1) {
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
    var __webpack_exports__ = __webpack_require__(913);
    var __webpack_export_target__ = exports;
    for(var __webpack_i__ in __webpack_exports__)__webpack_export_target__[__webpack_i__] = __webpack_exports__[__webpack_i__];
    if (__webpack_exports__.__esModule) Object.defineProperty(__webpack_export_target__, '__esModule', {
        value: true
    });
})();

//# sourceMappingURL=index.js.map