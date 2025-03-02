use serde_json::{Map, Value, json};

use super::rule_getter::RuleGetter;

pub struct ReactPerfRuleGetter;

impl ReactPerfRuleGetter {
    pub fn new() -> Self {
        Self {}
    }
}

impl RuleGetter for ReactPerfRuleGetter {
    fn get_dev_override_rules(&self) -> Map<String, Value> {
        json!({}).as_object().map_or(Map::new(), |map| map.to_owned())
    }

    fn get_def_rules(&self) -> Map<String, Value> {
        json!({
          "react_perf/jsx-no-jsx-as-prop":1,
          "react_perf/jsx-no-new-array-as-prop":1,
          "react_perf/jsx-no-new-function-as-prop":1,
          "react_perf/jsx-no-new-object-as-prop":1,
        })
        .as_object()
        .map_or(Map::new(), |map| map.to_owned())
    }
}
