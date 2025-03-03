use anyhow::Context;
use oxc_linter::{LintPlugins, Oxlintrc};
use serde_json::{json, Map, Value};

use crate::environments::Environments;
use crate::lint_mode::LintMode;
use crate::rules::eslint::EslintRuleGetter;
use crate::rules::oxc::OxcRuleGetter;
use crate::rules::promise::PromiseRuleGetter;
use crate::rules::rule_getter::RuleGetter;
use crate::rules::unicorn::UnicornRuleGetter;
use crate::rules::{
    react::{ReactConfig, ReactRuleGetter},
    typescript::{TypescriptConfig, TypescriptRuleGetter},
};

pub struct ConfigBuilder {
    envs: Environments,
    mode: LintMode,
    define: Map<String, Value>,
    react: Option<ReactConfig>,
    ts: Option<TypescriptConfig>,
}

impl Default for ConfigBuilder {
    fn default() -> Self {
        Self {
            envs: Environments::default(),
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

    pub fn with_envs(mut self, envs: Environments) -> Self {
        self.envs = envs;
        self
    }

    fn get_def_plugins(&self) -> LintPlugins {
        let mut plugins = LintPlugins::ESLINT
            | LintPlugins::UNICORN
            | LintPlugins::IMPORT
            | LintPlugins::PROMISE
            | LintPlugins::OXC;

        if self.ts.is_some() {
            plugins |= LintPlugins::TYPESCRIPT
        }

        if self.react.is_some() {
            plugins |= LintPlugins::REACT | LintPlugins::REACT_PERF
        }

        plugins
    }

    fn get_def_rules(&self) -> Map<String, Value> {
        let eslint = EslintRuleGetter::default().get_def_rules();
        let oxc = OxcRuleGetter::default().get_def_rules();
        let promise = PromiseRuleGetter::default().get_def_rules();
        let unicorn = UnicornRuleGetter::default().get_def_rules();
        let mut merged = Map::new();
        merged.extend(eslint);
        merged.extend(oxc);
        merged.extend(promise);
        merged.extend(unicorn);
        merged
    }

    pub fn build(self) -> anyhow::Result<Oxlintrc> {
        let def_plugin = self.get_def_plugins();
        let def_rules = self.get_def_rules();

        let react_rules = if let Some(react) = self.react {
            ReactRuleGetter::default()
                .with_runtime(react.runtime)
                .get_def_rules()
        } else {
            Map::new()
        };

        let ts_rules = if let Some(ts) = self.ts {
            TypescriptRuleGetter::default()
                .with_config(ts)
                .get_def_rules()
        } else {
            Map::new()
        };

        let res = serde_json::from_value::<Oxlintrc>(json!({
            "plugins": def_plugin,
            "env": self.envs,
            "globals": self.define,
            "settings": {},
            "rules": def_rules,
            "overrides":[
              {
                "files":["*.{ts,tsx,cts,mts}"],
                "rules": ts_rules
              },
              {
                "files":["*.{jsx,tsx}"],
                "rules": react_rules
              }
            ]
        }));

        res.with_context(|| "Failed to build config")
    }
}
