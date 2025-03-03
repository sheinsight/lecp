use serde_json::{Map, Value};

pub trait RuleGetter {
    fn get_def_rules(&self) -> Map<String, Value>;
}
