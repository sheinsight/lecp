use serde_json::{json, Map, Value};

use super::rule_getter::RuleGetter;

pub struct EslintRuleGetter;

impl EslintRuleGetter {
    pub fn new() -> Self {
        Self {}
    }
}

impl RuleGetter for EslintRuleGetter {
    fn get_dev_override_rules(&self) -> Map<String, Value> {
        json!({
            "eslint/no-console":[1,{"allow":["error","warn","info"]}],
            "eslint/no-debugger":1,
            "eslint/no-alert":1,
            "eslint/no-empty":1,
            "eslint/no-empty-function":1,
            "eslint/no-empty-static-block":1
        })
        .as_object()
        .map_or(Map::new(), |map| map.to_owned())
    }

    fn get_def_rules(&self) -> Map<String, Value> {
        json!({
            "eslint/for-direction": 2,
            "eslint/no-empty-pattern":2,
            "eslint/no-async-promise-executor": 2,
            "eslint/no-caller": 2,
            "eslint/no-class-assign": 2,
            "eslint/no-compare-neg-zero": 2,
            "eslint/no-control-regex":2,
            "eslint/no-const-assign":2,
            "eslint/no-constant-binary-expression":2,
            "eslint/no-delete-var":2,
            "eslint/no-dupe-class-members":2,
            "eslint/no-dupe-else-if":2,
            "eslint/no-dupe-keys":2,
            "eslint/no-duplicate-case":2,
            "eslint/no-empty-character-class":2,
            "eslint/no-ex-assign":2,
            "eslint/no-func-assign":2,
            "eslint/no-import-assign":2,
            "eslint/no-loss-of-precision":2,
            "eslint/no-new-native-nonconstructor":2,
            "eslint/no-nonoctal-decimal-escape":2,
            "eslint/no-obj-calls":2,
            "eslint/no-shadow-restricted-names":2,
            "eslint/no-setter-return":2,
            "eslint/no-sparse-arrays":2,
            "eslint/no-this-before-super":2,
            "eslint/no-unsafe-finally":2,
            "eslint/no-unused-labels":2,
            "eslint/no-useless-catch":2,
            "eslint/no-useless-escape":2,
            "eslint/no-useless-call":2,
            "eslint/no-eq-null":2,
            "eslint/no-iterator":2,
            "eslint/no-proto":2,
            "eslint/no-regex-spaces":2,
            "eslint/no-array-constructor":2,
            "eslint/no-case-declarations":2,
            "eslint/no-constructor-return":2,
            "eslint/no-throw-literal":2,
            "eslint/no-self-compare":2,
            "eslint/no-prototype-builtins":2,
            "eslint/no-extra-label":2,
            "eslint/no-label-var":2,
            "eslint/no-lone-blocks":2,
            "eslint/no-multi-assign":2,
            "eslint/no-multi-str":2,
            "eslint/no-unexpected-multiline":2,
            "eslint/no-var":2,
            "eslint/no-cond-assign": [2,"except-parens"],
            // 实际上只要禁用了 var 的使用，就只剩函数的场景会触发，因为只有 var、function 才会牵扯到提升问题
            "eslint/no-inner-declarations":[2,"functions"],
            "eslint/no-global-assign":[2,{"exceptions":[]}],
            "eslint/no-extend-native":[2,{
               "exceptions":[]
            }],
            "eslint/no-redeclare":[2,{"builtinGlobals":true}],
            "eslint/require-yield":2,
            "eslint/default-case":2,
            "eslint/require-await":2,
            "eslint/symbol-description":2,
            "eslint/default-case-last":2,
            "eslint/prefer-object-has-own":2,
            "eslint/prefer-object-spread":2,
            "eslint/prefer-rest-params":2,
            "eslint/prefer-spread":2,
            "eslint/guard-for-in": 2,
            "eslint/func-names": [2, "as-needed"],
            "eslint/init-declarations": [2, "always"],
            "eslint/func-style": [2, "declaration", { "allowArrowFunctions": true }],
            "eslint/no-extra-boolean-cast":[2,{"enforceForLogicalOperands":false}],
            "eslint/no-invalid-regexp":[2,{"allowConstructorFlags":[]}],
            "eslint/no-self-assign":[2,{"props": true}],
            "eslint/no-unsafe-negation":[2,{"enforceForOrderingRelations":true}],
            "eslint/no-unsafe-optional-chaining":[2,{"disallowArithmeticOperators":true}],
            "eslint/no-irregular-whitespace":[2,{}],
            // TODO 可能跟 ts 的那个 import type 冲突
            "eslint/no-duplicate-imports": [2, {
                "includeExports": true
            }],
            "eslint/prefer-promise-reject-errors": [2, {
                "allowEmptyReject": true
            }],
            "eslint/no-useless-rename":[2,{
                "ignoreImport":false,
                "ignoreDestructuring":false,
                "ignoreExport":false
            }],
            "eslint/use-isnan":[2,{
                "enforceForSwitchCase":true,
                "enforceForIndexOf":true
            }],
            "eslint/valid-typeof":[2,{
                "requireStringLiterals":true
            }],
            "eslint/no-void": [2, {
                "allowAsStatement": true
            }],
            "eslint/array-callback-return": [2, {
                "checkForEach": true,
                "allowImplicit": false
            }],
            "eslint/eqeqeq":[2,"always",{
                "null":"always"
            }],
            "eslint/no-constant-condition":1,
            "eslint/no-empty-static-block":2,
            "eslint/no-debugger":1,
            "eslint/no-unused-private-class-members":1,
            "eslint/no-await-in-loop":1,
            // TODO 微前端需要用，所以设置为 warn
            "eslint/no-eval":1,
            "eslint/no-alert":2,
            "eslint/no-empty":2,
            "eslint/no-empty-function":2,
            "eslint/no-new":1,
            "eslint/no-useless-concat":1,
            "eslint/no-useless-constructor":1,
            "eslint/no-object-constructor":1,
            "eslint/default-param-last":1,
            "eslint/no-nested-ternary":0,
            "eslint/prefer-exponentiation-operator": 1,
            "eslint/radix":[1,"as-needed"],
            // TODO 异常太多，先关闭
            "eslint/no-magic-numbers":[0,{
                "ignore": [-1, 0, 1, 2],
                "ignoreArrayIndexes": true,
                "enforceConst": true,
                "detectObjects": false
            }],
            "eslint/yoda": [1, "never", {
                "exceptRange": true,
                "onlyEquality": true
            }],
            "eslint/no-fallthrough":[1,{
                "allowEmptyCases":true
            }],
            "eslint/no-unused-expressions":[1,{
                "allowShortCircuit": false,
                "allowTernary": true,
                "allowTaggedTemplates": true,
                "enforceForJSX": true
            }],
            "eslint/no-unused-vars":[1,{
                "vars":"all",
                "args":"all",
                "caughtErrors":"all",
                "varsIgnorePattern":"^_",
                "argsIgnorePattern":"^_",
                "caughtErrorsIgnorePattern":"^_",
                "destructuredArrayIgnorePattern":"^_",
                "ignoreRestSiblings":false,
                "ignoreClassWithStaticInitBlock":false,
                "reportUsedIgnorePattern":true
            }],
            "eslint/no-bitwise":0,
            "eslint/no-console":[2,{"allow":["error","warn","info"]}],
            "eslint/no-div-regex":0,
            "eslint/no-plusplus":0,
            // TODO 这个应该跟 define 联动配置
            "eslint/no-undef":1,
            "eslint/no-undefined":0,
            "eslint/no-restricted-globals": 0,
            "eslint/unicode-bom":0,
            "eslint/max-classes-per-file":0,
            "eslint/max-lines":0,
            "eslint/no-else-return":0,
            "eslint/no-negated-condition":0,
            "eslint/sort-vars":0,
            "eslint/max-params":0,
            "eslint/new-cap":0,
            "eslint/no-continue":0,
            "eslint/no-labels":0,
            "eslint/no-new-func":0,
            "eslint/no-return-assign":0,
            "eslint/no-script-url":0,
            "eslint/no-template-curly-in-string":0,
            "eslint/no-ternary":0,
            "eslint/prefer-numeric-literals":0,
            "eslint/sort-imports":0,
            "eslint/sort-keys":0,
            "eslint/vars-on-top": 0
        })
        .as_object()
        .map_or(Map::new(), |map| map.to_owned())
    }
}
