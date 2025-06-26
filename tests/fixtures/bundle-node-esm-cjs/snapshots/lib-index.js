(()=>{
    "use strict";
    var __webpack_require__ = {};
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
        sleep: ()=>sleep,
        asyncFn: ()=>asyncFn
    });
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
    var __webpack_export_target__ = exports;
    for(var __webpack_i__ in __webpack_exports__)__webpack_export_target__[__webpack_i__] = __webpack_exports__[__webpack_i__];
    if (__webpack_exports__.__esModule) Object.defineProperty(__webpack_export_target__, '__esModule', {
        value: true
    });
})();

//# sourceMappingURL=index.js.map