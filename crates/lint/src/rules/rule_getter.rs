use serde_json::{Map, Value};

pub trait RuleGetter {
    fn get_def(&self) -> Map<String, Value>;
}
