use serde_json::{json, Map, Value};

use crate::rules::rule_getter::RuleGetter;

pub struct JestRuleGetter;

impl Default for JestRuleGetter {
    fn default() -> Self {
        Self {}
    }
}

impl RuleGetter for JestRuleGetter {
    fn get_def(&self) -> Map<String, Value> {
        json!({
            "jest/no-standalone-expect": 2,
            "jest/prefer-lowercase-title": 0,
            "jest/consistent-test-it": 0,
        })
        .as_object()
        .map_or(Map::new(), |map| map.to_owned())
    }
}
