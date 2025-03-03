use std::path::Path;

use oxc_linter::{LintPlugins, Oxlintrc};
use serde_json::{json, Map, Value};

use crate::environments::Environments;

pub struct OxcStd20250601<T: AsRef<Path>> {
    pub path: T,
    pub define: Map<String, Value>,
}

impl<T: AsRef<Path>> OxcStd20250601<T> {
    pub fn new(path: T) -> Self {
        Self {
            path,
            define: Map::new(),
        }
    }
}

impl<T: AsRef<Path>> OxcStd20250601<T> {
    pub fn with_define(mut self, additional_define: Map<String, Value>) -> Self {
        self.define.extend(additional_define);
        self
    }
}
// edition
impl<T: AsRef<Path>> OxcStd20250601<T> {
    pub fn get_plugins(&self) -> Vec<serde_json::Value> {
        serde_json::to_value(
            LintPlugins::ESLINT
                | LintPlugins::REACT
                | LintPlugins::REACT_PERF
                | LintPlugins::IMPORT
                | LintPlugins::UNICORN
                | LintPlugins::TYPESCRIPT
                | LintPlugins::IMPORT,
        )
        .unwrap_or_default()
        .as_array()
        .map_or(vec![], |plugins| plugins.to_owned())
    }

    pub fn get_globals(&self) -> serde_json::Value {
        serde_json::json!(self.define)
    }

    pub fn get_envs(&self) -> rustc_hash::FxHashMap<String, bool> {
        let env = Environments::Amd
            | Environments::Node
            | Environments::Es2024
            | Environments::Browser
            | Environments::CommonJS
            | Environments::Jest
            | Environments::Mocha;
        env.to_hash_map()
    }

    pub fn get_rules(&self) -> serde_json::Value {
        serde_json::json!({})
    }

    pub fn get_config(&self) -> Oxlintrc {
        serde_json::from_value::<Oxlintrc>(json!({
            "plugins": self.get_plugins(),
            "env": self.get_envs(),
            "globals": self.get_globals(),
            "settings": {},
            "rules": {
                "eslint/for-direction": 2,
                "eslint/getter-return": [ 2, { "allowImplicit": true } ],
                "eslint/no-async-promise-executor": 2,
                "eslint/no-case-declarations": 2,
                "eslint/no-class-assign": 2,
                "eslint/no-compare-neg-zero": 2,
                "eslint/no-cond-assign": 2,
                "eslint/no-const-assign": 2,
                "eslint/no-constant-binary-expression": 2,
                "eslint/no-constant-condition": 2,
                "eslint/no-control-regex": 2,
                "eslint/no-delete-var": 2,
                "eslint/no-dupe-class-members": 2,
                "eslint/no-dupe-else-if": 2,
                "eslint/no-dupe-keys": 2,
                "eslint/no-duplicate-case": 2,
                "eslint/no-empty": [2, { "allowEmptyCatch": true }],
                "eslint/no-empty-character-class": 2,
                "eslint/no-empty-pattern": 2,
                "eslint/no-ex-assign": 2,
                "eslint/no-fallthrough": [2,{
                    "allowEmptyCases":true
                }],
                "eslint/no-func-assign": 2,
                "eslint/no-global-assign": 2,
                "eslint/no-import-assign": 2,
                "eslint/no-inner-declarations":[2,"functions"],
                "eslint/no-invalid-regexp":[2,{"allowConstructorFlags":[]}],
                "eslint/no-irregular-whitespace": 2,
                "eslint/no-loss-of-precision": 2,
                "eslint/no-new-native-nonconstructor": 2,
                "eslint/no-nonoctal-decimal-escape": 2,
                "eslint/no-obj-calls": 2,
                "eslint/no-prototype-builtins": 2,
                "eslint/no-redeclare":[2,{"builtinGlobals":true}],
                "eslint/no-regex-spaces": 2,
                "eslint/no-self-assign":[2,{"props": true}],
                "eslint/no-setter-return": 2,
                "eslint/no-shadow-restricted-names": 2,
                "eslint/no-sparse-arrays": 2,
                "eslint/no-this-before-super": 2,
                "eslint/no-unexpected-multiline": 2,
                "eslint/no-unreachable": 2,
                "eslint/no-unsafe-finally": 2,
                "eslint/no-unsafe-negation": [2, { "enforceForOrderingRelations": true }],
                "eslint/no-unsafe-optional-chaining":[2,{"disallowArithmeticOperators":true}],
                "eslint/no-unused-labels": 2,
                "eslint/no-useless-catch": 2,
                "eslint/no-useless-escape": 2,
                "eslint/use-isnan": [2, { "enforceForIndexOf": true }],
                "eslint/valid-typeof": 2,
                "unicorn/new-for-builtins": 2,
                "unicorn/no-instanceof-array": 2,
                "unicorn/no-invalid-remove-event-listener": 2,
                "unicorn/no-thenable": 2,
                "unicorn/no-unreadable-array-destructuring": 2,
                "unicorn/require-array-join-separator": 2,
                "unicorn/require-number-to-fixed-digits-argument": 0,
                "import/export": 2,
            },
            "ignorePatterns":["node_modules","dist","build","public","*.min.js","*.min.css"],
            "overrides":[{
                "files":["*.{ts,tsx,cts,mts}"],
                "rules":{
                    "typescript/no-duplicate-enum-values": 2,
                    "typescript/no-extra-non-null-assertion": 2,
                    "typescript/no-misused-new": 2,
                    "typescript/no-non-null-asserted-optional-chain": 2,
                    "typescript/no-unsafe-declaration-merging": 2,
                    "typescript/no-unsafe-function-type": 2,
                    "typescript/no-wrapper-object-types": 2,
                    "typescript/prefer-namespace-keyword": 2,
                }
            },{
                "files":["*.{jsx,tsx}"],
                "rules":{
                    "react/jsx-no-comment-textnodes": 2,
                    "react/jsx-no-duplicate-props": 2,
                    "react/jsx-no-target-blank":[2,{
                        "enforceDynamicLinks": "always",
                        "warnOnSpreadAttributes":true,
                        "allow_referrer":true,
                        "links":true,
                        "forms":false
                    }],
                    "react/jsx-no-undef": 2,
                    "react/no-children-prop": 2,
                    "react/no-danger-with-children": 2,
                    "react/no-direct-mutation-state": 2,
                    "react/no-find-dom-node": 2,
                    "react/no-is-mounted": 2,
                    "react/no-render-return-value": 2,
                    "react/no-string-refs": 2,
                    "react/no-unescaped-entities": 2,
                    "react/require-render-return": 2,
                }
            }]
        }))
        .unwrap()
    }
}
