use oxc_linter::LintPlugins;
use serde_json::{json, Map, Value};

use crate::environments::EnvironmentFlags;
use crate::rules::category_getter::CategoryGetter;
use crate::rules::react_config::ReactConfig;
use crate::rules::rule_getter::RuleGetter;
use crate::rules::typescript_config::TypescriptConfig;
use crate::rules::v2025_06_01::eslint::EslintRuleGetter;
use crate::rules::v2025_06_01::jest::JestRuleGetter;
use crate::rules::v2025_06_01::oxc::OxcRuleGetter;
use crate::rules::v2025_06_01::promise::PromiseRuleGetter;
use crate::rules::v2025_06_01::react::ReactRuleGetter;
use crate::rules::v2025_06_01::typescript::TypescriptRuleGetter;
use crate::rules::v2025_06_01::unicorn::UnicornRuleGetter;

#[derive(Debug, Clone)]
pub struct Category20250601 {
    pub react: Option<ReactConfig>,
    pub typescript: Option<TypescriptConfig>,
}

impl Default for Category20250601 {
    fn default() -> Self {
        Self {
            react: None,
            typescript: None,
        }
    }
}

impl Category20250601 {
    pub fn with_react(mut self, react: ReactConfig) -> Self {
        self.react = Some(react);
        self
    }

    pub fn with_typescript(mut self, typescript: TypescriptConfig) -> Self {
        self.typescript = Some(typescript);
        self
    }
}

impl CategoryGetter for Category20250601 {
    fn get_def(&self) -> Map<String, Value> {
        let mut merged = Map::new();

        let eslint = EslintRuleGetter::default();
        let oxc = OxcRuleGetter::default();
        let promise = PromiseRuleGetter::default();
        let unicorn = UnicornRuleGetter::default();

        merged.extend(eslint.get_def());
        merged.extend(oxc.get_def());
        merged.extend(promise.get_def());
        merged.extend(unicorn.get_def());

        merged
    }

    fn get_ts_override(&self) -> Value {
        if let Some(typescript) = &self.typescript {
            let typescript = TypescriptRuleGetter::default().with_config(typescript.clone());
            json!({
                "files": ["*.{ts,tsx,cts,mts}"],
                "rules": typescript.get_def()
            })
        } else {
            json!({})
        }
    }

    fn get_react_override(&self) -> Value {
        if let Some(react) = &self.react {
            let react = ReactRuleGetter::default().with_runtime(react.runtime.clone());
            json!({
                "files": ["*.{jsx,tsx}"],
                "rules": react.get_def()
            })
        } else {
            json!({})
        }
    }

    fn get_jest_override(&self) -> Value {
        json!({
            "files": [
                "*.{test,spec}.{js,jsx,ts,tsx}",
                "**/{test,tests,spec,specs}/**",
            ],
            "plugins": LintPlugins::JEST,
            "env": EnvironmentFlags::Jest | EnvironmentFlags::Es2024,
            "rules": JestRuleGetter::default().get_def()
        })
    }

    fn get_def_plugins(&self) -> oxc_linter::LintPlugins {
        let mut plugins = LintPlugins::ESLINT
            | LintPlugins::UNICORN
            | LintPlugins::IMPORT
            | LintPlugins::PROMISE
            | LintPlugins::OXC
            | LintPlugins::JEST;

        if self.typescript.is_some() {
            plugins |= LintPlugins::TYPESCRIPT
        }

        if self.react.is_some() {
            plugins |= LintPlugins::REACT | LintPlugins::REACT_PERF
        }

        plugins
    }
}
