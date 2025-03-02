use serde_json::{Map, Value, json};

use super::rule_getter::RuleGetter;

pub struct PromiseRuleGetter;

impl PromiseRuleGetter {
    pub fn new() -> Self {
        Self {}
    }
}

impl RuleGetter for PromiseRuleGetter {
    fn get_dev_override_rules(&self) -> Map<String, Value> {
        json!({}).as_object().map_or(Map::new(), |map| map.to_owned())
    }

    fn get_def_rules(&self) -> Map<String, Value> {
        json!({
          "no-promise-in-callback":0,
          "promise/prefer-await-to-callbacks":0,
          "promise/no-callback-in-promise":[0,{"exceptions":[]}],
          "promise/valid-params":2,
          "promise/no-new-statics":2,
          "promise/spec-only":2,
          "promise/no-return-in-finally":2,
          "promise/avoid-new":1,
          "promise/param-names":1,
          "promise/prefer-await-to-then":[1,{ "strict": false }],
          "promise/catch-or-return":1
        })
        .as_object()
        .map_or(Map::new(), |map| map.to_owned())
    }
}
