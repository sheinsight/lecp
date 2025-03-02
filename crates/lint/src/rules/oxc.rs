use serde_json::{Map, Value, json};

use super::rule_getter::RuleGetter;

pub struct OxcRuleGetter;

impl OxcRuleGetter {
    pub fn new() -> Self {
        Self {}
    }
}

impl RuleGetter for OxcRuleGetter {
    fn get_dev_override_rules(&self) -> Map<String, Value> {
        json!({}).as_object().map_or(Map::new(), |map| map.to_owned())
    }

    fn get_def_rules(&self) -> Map<String, Value> {
        json!({
          "oxc/bad-array-method-on-arguments":2,
          "oxc/bad-char-at-comparison":2,
          "oxc/bad-comparison-sequence":2,
          "oxc/bad-min-max-func":2,
          "oxc/bad-object-literal-comparison":2,
          "oxc/bad-replace-all-arg":2,
          "oxc/const-comparisons":2,
          "oxc/erasing-op":2,
          "oxc/missing-throw":2,
          "oxc/number-arg-out-of-range":2,
          "oxc/uninvoked-array-callback":2,
          "oxc/bad-bitwise-operator":2,
          "oxc/no-const-enum":2,
          "oxc/double-comparisons":1,
          "oxc/only-used-in-recursion":1,
          "oxc/no-accumulating-spread":1,
          "oxc/no-barrel-file":1,
          "oxc/approx-constant":1,
          "oxc/misrefactored-assign-op":1,
          "oxc/no-async-await":0,
          "oxc/no-optional-chaining":0,
          "oxc/no-rest-spread-properties":0,
          "oxc/no-async-endpoint-handlers":0
        })
        .as_object()
        .map_or(Map::new(), |map| map.to_owned())
    }
}
