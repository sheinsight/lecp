use serde_json::{Map, Value};

pub trait RuleGetter {
    fn get_dev_override_rules(&self) -> Map<String, Value>;
    fn get_def_rules(&self) -> Map<String, Value>;
}
