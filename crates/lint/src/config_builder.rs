use crate::lint_mode::LintMode;
use crate::rules::category_getter::CategoryGetter;
use crate::rules::react_config::ReactConfig;
use crate::rules::typescript_config::TypescriptConfig;
use crate::rules::v2025_06_01::category::Category20250601;
use crate::{environments::EnvironmentFlags, rules::category_getter::Category};
use anyhow::Context;
use oxc_linter::Oxlintrc;
use serde_json::{json, Map, Value};
use std::path::PathBuf;

/**
 * 👍 1. 必须知道模块系统是什么 。 🤔 testing 需不需要独立配置 ？？？
 * 1.1 强制统一配置 esm 。
 *
 * 👍 2. 必须知道检查目标是 系统 还是 包，检测的机制不一样，例如对于 package.json 的检测。
 * 2.1 直接传给我
 *
 * 👍 3. 必须知道目标应用，例如是 vue 还是 react 还是 其他。
 * 3.1 部分自动感知，探知 deps 信息
 * 3.2 🤔 放开 global ？
 *
 * 👍 4. 对于测试系统的整合，似乎也要知道测试框架是什么。
 * 4.1 强制统一测试框架 ， 所以可以不开放 env 配置。
 *
 * 🚨 5. 要知道模式，例如是 development 还是 production。
 *
 *
 * 👍 6. 要知道是否启用 ts、默认启用
 *
 * 👍 7. 要知道 define。
 * 👍 8. 要知道 category，主要是用来区分版本信息的
 */

#[derive(Debug, Clone)]
pub struct ConfigBuilder {
    mode: LintMode,
    envs: EnvironmentFlags,
    define: Map<String, Value>,
    react: Option<ReactConfig>,
    ts: Option<TypescriptConfig>,
    package_json: Option<PathBuf>,
    category: Category,
}

impl Default for ConfigBuilder {
    fn default() -> Self {
        Self {
            envs: EnvironmentFlags::default(),
            mode: LintMode::Development,
            define: Map::new(),
            category: Category::V20250601(Category20250601::default()),
            react: None,
            ts: None,
            package_json: None,
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

    pub fn with_package_json(mut self, package_json: PathBuf) -> Self {
        self.package_json = Some(package_json);
        self
    }

    pub fn with_category(mut self, category: Category) -> Self {
        self.category = category;
        self
    }

    pub fn build(&self) -> anyhow::Result<Oxlintrc> {
        let mut category = match &self.category {
            Category::V20250601(category) => category.to_owned(),
        };

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
            //   category.get_ts_override(),
              category.get_react_override(),
              category.get_jest_override(),
            ]
        }));

        res.with_context(|| "Failed to build config")
    }
}
