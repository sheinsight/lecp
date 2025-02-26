pub trait RuleGetter {
    fn get_dev_override_rules() -> serde_json::Value;
    fn get_def_rules() -> serde_json::Value;
}
