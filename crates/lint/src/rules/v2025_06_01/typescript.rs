use serde_json::{json, Map, Value};

use crate::rules::rule_getter::RuleGetter;
use crate::rules::typescript_config::TypescriptConfig;
pub struct TypescriptRuleGetter {
    config: TypescriptConfig,
}

impl Default for TypescriptRuleGetter {
    fn default() -> Self {
        Self {
            config: TypescriptConfig::default(),
        }
    }
}

impl TypescriptRuleGetter {
    pub fn with_config(mut self, config: TypescriptConfig) -> Self {
        self.config = config;
        self
    }
}

impl RuleGetter for TypescriptRuleGetter {
    fn get_def(&self) -> Map<String, Value> {
        json!({
          "typescript/no-duplicate-enum-values":2,
          "typescript/no-extra-non-null-assertion": 2,
          "typescript/no-misused-new": 2,
          "typescript/no-non-null-asserted-optional-chain": 2,
          "typescript/no-this-alias":2,
          "typescript/no-unsafe-declaration-merging":2,
          "typescript/no-useless-empty-export":2,
          "typescript/no-wrapper-object-types":2,
          "typescript/prefer-as-const":2,
          "typescript/no-non-null-asserted-nullish-coalescing":2,
          "typescript/prefer-literal-enum-member":2,
          "typescript/no-confusing-non-null-assertion":2,
          "typescript/prefer-enum-initializers":2,
          "typescript/ban-tslint-comment":2,
          "typescript/triple-slash-reference":[2,{
            "path": "never",
            "types": "prefer-import",
            "lib": "always"
          }],
          "typescript/explicit-function-return-type":[2,{
            "allow_expressions":false,
            "allow_typed_function_expressions":true,
            "allow_direct_const_assertion_in_arrow_functions":false,
            "allow_concise_arrow_function_expressions_starting_with_void":false,
            "allow_functions_without_type_parameters":false,
            "allowed_names":[],
            "allow_higher_order_functions":false,
            "allow_iifes":true
          }],
          "typescript/no-namespace":[2,{
            "allowDeclarations": true,
            "allowDefinitionFiles": true
          }],
          "typescript/ban-types":[2,{
            "types": {
              "String": {
                "message": "Use string instead",
                "fixWith": "string"
              },
              "Number": {
                "message": "Use number instead",
                "fixWith": "number"
              },
              "Boolean": {
                "message": "Use boolean instead",
                "fixWith": "boolean"
              },
              "Symbol": {
                "message": "Use symbol instead",
                "fixWith": "symbol"
              },
              "Object": {
                "message": "Use object instead",
                "fixWith": "object"
              },
              "Function": {
                "message": "Use specific function type instead"
              },
              "{}": {
                "message": "Use Record<string, unknown> instead",
                "fixWith": "Record<string, unknown>"
              }
            }
          }],

          "typescript/no-dynamic-delete":1,
          "typescript/no-empty-object-type":1,
          "typescript/no-explicit-any":1,
          "typescript/no-non-null-assertion":1,
          "typescript/no-extraneous-class":1,
          "typescript/prefer-ts-expect-error":1,
          "typescript/adjacent-overload-signatures":1,
          "typescript/no-empty-interface":1,
          "typescript/no-import-type-side-effects":0,
          "typescript/no-require-imports":0,
          "typescript/no-var-requires":0,
          "typescript/no-unnecessary-type-constraint":0,
          "typescript/ban-ts-comment":0,
          "typescript/no-unsafe-function-type":2,
          "typescript/array-type":0,
          "typescript/consistent-generic-constructors":0,
          "typescript/consistent-indexed-object-style":0,
          "typescript/consistent-type-definitions":0,
          "typescript/no-inferrable-types":0,
          "typescript/prefer-for-of":0,
          "typescript/prefer-function-type":0,
          "typescript/prefer-namespace-keyword":2
        })
        .as_object()
        .map_or(Map::new(), |map| map.to_owned())
    }
}
