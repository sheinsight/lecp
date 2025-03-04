use oxc_linter::LintPlugins;
use serde_json::{Map, Value};

pub trait CategoryGetter {
    fn get_def(&self) -> Map<String, Value>;

    fn get_ts_override(&self) -> Value;

    fn get_react_override(&self) -> Value;

    fn get_jest_override(&self) -> Value;

    fn get_def_plugins(&self) -> LintPlugins;
}
