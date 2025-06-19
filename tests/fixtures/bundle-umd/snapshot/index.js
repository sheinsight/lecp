(function webpackUniversalModuleDefinition(root, factory) {

      if(typeof exports === 'object' && typeof module === 'object') {
          module.exports = factory(require("React"));
      }else if(typeof define === 'function' && define.amd) {
          
          define(["React"], factory);

          } else if(typeof exports === 'object'){

          
      exports["DemoComponent"] = factory(require("React"));

      } else {

          
      root["DemoComponent"] = factory(root["React"]);
      }

      })(self, (__WEBPACK_EXTERNAL_MODULE__24__) => {
          return (() => { // webpackBootstrap
var __webpack_modules__ = ({
439: (function (__unused_webpack_module, __webpack_exports__, __webpack_require__) {
"use strict";
__webpack_require__.r(__webpack_exports__);
__webpack_require__.d(__webpack_exports__, {
  "default": () => (__WEBPACK_DEFAULT_EXPORT__)
});
// extracted by css-extract-rspack-plugin
/* ESM default export */ const __WEBPACK_DEFAULT_EXPORT__ = ({"title":"demo-component__title","foo":"demo-component__foo"});

}),
474: (function (module, exports, __webpack_require__) {
(function(global, factory) {
    if ( true && typeof module.exports === "object") factory(exports, __webpack_require__(439));
    else if (typeof define === "function" && define.amd) define([
        "exports",
        "./Demo.css"
    ], factory);
    else if (global = typeof globalThis !== "undefined" ? globalThis : global || self) factory(global.demo = {}, global.demoCss);
})(this, function(exports, _Democss) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    Object.defineProperty(exports, "default", {
        enumerable: true,
        get: function() {
            return _default;
        }
    });
    _Democss = /*#__PURE__*/ _interop_require_default(_Democss);
    function _interop_require_default(obj) {
        return obj && obj.__esModule ? obj : {
            default: obj
        };
    }
    const Demo = ()=>{
        return /*#__PURE__*/ React.createElement("div", {
            className: _Democss.default.container
        }, /*#__PURE__*/ React.createElement("h1", {
            className: _Democss.default.title
        }, "Hello, World!"));
    };
    const _default = Demo;
});


}),
908: (function (module, exports, __webpack_require__) {
(function(global, factory) {
    if ( true && typeof module.exports === "object") factory(exports, __webpack_require__(24), __webpack_require__(474), __webpack_require__(322));
    else if (typeof define === "function" && define.amd) define([
        "exports",
        "react",
        "@/components/Demo",
        "./utils"
    ], factory);
    else if (global = typeof globalThis !== "undefined" ? globalThis : global || self) factory(global.index = {}, global.react, global.demo, global.utils);
})(this, function(exports, _react, _Demo, _utils) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    function _export(target, all) {
        for(var name in all)Object.defineProperty(target, name, {
            enumerable: true,
            get: Object.getOwnPropertyDescriptor(all, name).get
        });
    }
    _export(exports, {
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
    if (true) {
        console.log("env_dev");
    }
    if (false) {}
    if (true) {
        console.log("Debug info");
    }
    if (false) {}
    if (typeof window !== "undefined") {
        console.log("Browser environment");
    }
});


}),
322: (function (module, exports) {
(function(global, factory) {
    if ( true && typeof module.exports === "object") factory(exports);
    else if (typeof define === "function" && define.amd) define([
        "exports"
    ], factory);
    else if (global = typeof globalThis !== "undefined" ? globalThis : global || self) factory(global.index = {});
})(this, function(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    Object.defineProperty(exports, "sleep", {
        enumerable: true,
        get: function() {
            return sleep;
        }
    });
    const sleep = (ms)=>new Promise((resolve)=>setTimeout(resolve, ms));
});


}),
24: (function (module) {
"use strict";
module.exports = __WEBPACK_EXTERNAL_MODULE__24__;

}),

});
/************************************************************************/
// The module cache
var __webpack_module_cache__ = {};

// The require function
function __webpack_require__(moduleId) {

// Check if module is in cache
var cachedModule = __webpack_module_cache__[moduleId];
if (cachedModule !== undefined) {
return cachedModule.exports;
}
// Create a new module (and put it into the cache)
var module = (__webpack_module_cache__[moduleId] = {
exports: {}
});
// Execute the module function
__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);

// Return the exports of the module
return module.exports;

}

/************************************************************************/
// webpack/runtime/define_property_getters
(() => {
__webpack_require__.d = (exports, definition) => {
	for(var key in definition) {
        if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
            Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
        }
    }
};
})();
// webpack/runtime/has_own_property
(() => {
__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
})();
// webpack/runtime/make_namespace_object
(() => {
// define __esModule on exports
__webpack_require__.r = (exports) => {
	if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
		Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
	}
	Object.defineProperty(exports, '__esModule', { value: true });
};
})();
/************************************************************************/
// startup
// Load entry module and return exports
// This entry module is referenced by other modules so it can't be inlined
var __webpack_exports__ = __webpack_require__(908);
return __webpack_exports__;
})()

});
//# sourceMappingURL=index.js.map