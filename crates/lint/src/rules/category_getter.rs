use oxc_linter::LintPlugins;
use serde_json::{Map, Value};

use super::v2025_06_01::category::Category20250601;

pub trait CategoryGetter {
    fn get_def(&self) -> Map<String, Value>;

    fn get_ts_override(&self) -> Value;

    fn get_react_override(&self) -> Value;

    fn get_jest_override(&self) -> Value;

    fn get_def_plugins(&self) -> LintPlugins;
}

#[derive(Debug, Clone)]
pub enum Category {
    V20250601(Category20250601),
}
