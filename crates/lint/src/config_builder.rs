use anyhow::Context;
use oxc_linter::Oxlintrc;
use serde_json::{json, Map, Value};

use crate::environments::EnvironmentFlags;
use crate::lint_mode::LintMode;
use crate::rules::category_getter::CategoryGetter;
use crate::rules::react_config::ReactConfig;
use crate::rules::typescript_config::TypescriptConfig;
use crate::rules::v2025_06_01::category::Category20250601;

#[derive(Debug, Clone)]
pub struct ConfigBuilder {
    envs: EnvironmentFlags,
    mode: LintMode,
    define: Map<String, Value>,
    react: Option<ReactConfig>,
    ts: Option<TypescriptConfig>,
}

impl Default for ConfigBuilder {
    fn default() -> Self {
        Self {
            envs: EnvironmentFlags::default(),
            mode: LintMode::Development,
            define: Map::new(),
            react: None,
            ts: None,
        }
    }
}

impl ConfigBuilder {
    pub fn with_mode(mut self, mode: LintMode) -> Self {
        self.mode = mode;
        self
    }

    pub fn with_define(mut self, define: Map<String, Value>) -> Self {
        self.define = define;
        self
    }

    pub fn with_react(mut self, react: ReactConfig) -> Self {
        self.react = Some(react);
        self
    }

    pub fn with_typescript(mut self, ts: TypescriptConfig) -> Self {
        self.ts = Some(ts);
        self
    }

    pub fn with_envs(mut self, envs: EnvironmentFlags) -> Self {
        self.envs = envs;
        self
    }

    pub fn build(&self) -> anyhow::Result<Oxlintrc> {
        let mut category = Category20250601::default();
        if let Some(react) = &self.react {
            category = category.with_react(react.clone());
        }

        if let Some(ts) = &self.ts {
            category = category.with_typescript(ts.clone());
        }

        let res = serde_json::from_value::<Oxlintrc>(json!({
            "plugins": category.get_def_plugins(),
            "env": self.envs,
            "globals": self.define,
            "settings": {},
            "rules": category.get_def(),
            "overrides":[
              category.get_ts_override(),
              category.get_react_override()
            ]
        }));

        res.with_context(|| "Failed to build config")
    }
}
