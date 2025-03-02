use serde_json::{json, Map, Value};

use super::rule_getter::RuleGetter;

pub struct UnicornRuleGetter;

impl UnicornRuleGetter {
    pub fn new() -> Self {
        Self {}
    }
}

impl RuleGetter for UnicornRuleGetter {
    fn get_dev_override_rules(&self) -> Map<String, Value> {
        json!({})
            .as_object()
            .map_or(Map::new(), |map| map.to_owned())
    }

    fn get_def_rules(&self) -> Map<String, Value> {
        json!({
          "unicorn/no-await-in-promise-methods": 2,
          "unicorn/no-document-cookie": 2,
          "unicorn/no-invalid-remove-event-listener": 2,
          "unicorn/no-new-array": 2,
          "unicorn/no-thenable": 2,
          "unicorn/no-unnecessary-await": 2,
          "unicorn/no-useless-spread": 1,
          "unicorn/prefer-set-size": 1,
          "unicorn/no-useless-length-check": 1,
          "unicorn/prefer-string-starts-ends-with": 1,
          "unicorn/no-useless-fallback-in-spread": 1,
          "unicorn/no-single-promise-in-promise-methods": 1,
          "unicorn/no-empty-file": 1,
          "unicorn/prefer-set-has": 1,
          "unicorn/no-abusive-eslint-disable": 2,
          "unicorn/no-anonymous-default-export": 2,
          "unicorn/no-array-for-each": 2,
          "unicorn/no-array-reduce": 0,
          "unicorn/no-length-as-slice-end": 1,
          "unicorn/no-magic-array-flat-depth": 1,
          "unicorn/no-nested-ternary": 1,
          "unicorn/no-process-exit": 0,
          "unicorn/prefer-modern-math-apis": 1,
          "unicorn/prefer-node-protocol": 2,
          "unicorn/prefer-number-properties": 0,
          "unicorn/consistent-function-scoping": 0,
          "unicorn/prefer-add-event-listener": 2,
          "consistent-empty-array-spread": 1,
          "unicorn/escape-case": 2,
          "unicorn/explicit-length-check": 0,
          "unicorn/new-for-builtins": 2,
          "unicorn/no-hex-escape": 2,
          "unicorn/no-instanceof-array": 2,
          "unicorn/no-lonely-if": 1,
          "unicorn/no-negation-in-equality-check": 2,
          "unicorn/no-new-buffer": 2,
          "unicorn/no-object-as-default-parameter": 1,
          "unicorn/no-static-only-class": 0,
          "unicorn/no-this-assignment": 2,
          "unicorn/no-typeof-undefined": 0,
          "unicorn/no-unreadable-iife": 0,
          "unicorn/no-useless-promise-resolve-reject": 2,
          "unicorn/no-useless-switch-case": 2,
          "unicorn/no-useless-undefined": 0,
          "unicorn/prefer-array-flat": 1,
          "unicorn/prefer-array-some": 1,
          "unicorn/prefer-blob-reading-methods": 1,
          "unicorn/prefer-code-point": 2,
          "unicorn/prefer-date-now": 1,
          "unicorn/prefer-dom-node-append": 1,
          "unicorn/prefer-dom-node-dataset": 1,
          "unicorn/prefer-dom-node-remove": 1,
          "unicorn/prefer-event-target": 1,
          "unicorn/prefer-math-min-max": 1,
          "unicorn/prefer-math-trunc": 1,
          "unicorn/prefer-native-coercion-functions": 2,
          "unicorn/prefer-prototype-methods": 1,
          "unicorn/prefer-query-selector": 1,
          "unicorn/prefer-regexp-test": 1,
          "unicorn/prefer-string-replace-all": 2,
          "unicorn/prefer-string-slice": 1,
          "unicorn/prefer-type-error": 1,
          "unicorn/require-number-to-fixed-digits-argument": 1,
          "unicorn/catch-error-name": 0,
          "unicorn/consistent-existence-index-check": 1,
          "unicorn/empty-brace-spaces": 0,
          "unicorn/error-message": 2,
          "unicorn/filename-case": [2, "kebabCase"],
          "unicorn/no-await-expression-member": 1,
          "unicorn/no-console-spaces": 0,
          "unicorn/no-null": 0,
          "unicorn/no-unreadable-array-destructuring": 0,
          "unicorn/no-zero-fractions": 1,
          "unicorn/number-literal-case": 1,
          "unicorn/numeric-separators-style": 2,
          "unicorn/prefer-array-flat-map": 1,
          "unicorn/prefer-dom-node-text-content": 1,
          "unicorn/prefer-includes": 1,
          "unicorn/prefer-logical-operator-over-ternary": 0,
          "unicorn/prefer-modern-dom-apis": 0,
          "unicorn/prefer-negative-index": 1,
          "unicorn/prefer-optional-catch-binding": 1,
          "unicorn/prefer-reflect-apply": 2,
          "unicorn/prefer-spread": 1,
          "unicorn/prefer-string-raw": 2,
          "unicorn/prefer-string-trim-start-end": 1,
          "unicorn/prefer-structured-clone": 1,
          "unicorn/require-array-join-separator": 2,
          "unicorn/switch-case-braces": 2,
          "unicorn/text-encoding-identifier-case": 1,
          "unicorn/throw-new-error": 2
        })
        .as_object()
        .map_or(Map::new(), |map| map.to_owned())
    }
}
