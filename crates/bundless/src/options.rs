use anyhow::Result;
use serde::{Deserialize, Serialize};
use serde_json::json;
use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::sync::LazyLock;
use swc_core::base::config::Options;

use crate::{get_out_ext, serde_error_to_miette};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(untagged)]
pub enum Shims {
    Boolean(bool),
    Object {
        #[serde(default)]
        legacy: Option<bool>,
    },
}

impl Default for Shims {
    fn default() -> Self {
        Shims::Boolean(false)
    }
}

impl Shims {
    pub fn is_enabled(&self) -> bool {
        match self {
            Shims::Boolean(value) => *value,
            Shims::Object { .. } => true,
        }
    }

    pub fn legacy(&self) -> bool {
        match self {
            Shims::Boolean(_) => false,
            Shims::Object { legacy } => legacy.unwrap_or(false),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub enum JsxRuntime {
    Automatic,
    #[default]
    Classic,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct React {
    #[serde(default = "default_jsx_runtime")]
    pub jsx_runtime: Option<JsxRuntime>,
}

impl Default for React {
    fn default() -> Self {
        Self { jsx_runtime: Some(JsxRuntime::default()) }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "lowercase")]
pub enum ModuleType {
    #[default]
    ESM,
    CJS,
    // Umd,
}

impl ModuleType {
    pub fn to_string(&self) -> String {
        match self {
            ModuleType::ESM => "es6".to_string(),
            ModuleType::CJS => "commonjs".to_string(),
            // ModuleType::Umd => "umd".to_string(),
        }
    }

    pub fn get_type(&self) -> String {
        match self {
            ModuleType::ESM => "esm".to_string(),
            ModuleType::CJS => "cjs".to_string(),
            // ModuleType::Umd => "umd".to_string(),
        }
    }
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CSS {
    pub css_modules: Option<String>,
    pub less_compile: bool,
}

impl CSS {
    pub fn css_modules(mut self, css_modules: &str) -> Self {
        self.css_modules = Some(css_modules.to_string());
        self
    }

    pub fn less_compile(mut self, less_compile: bool) -> Self {
        self.less_compile = less_compile;
        self
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Alias {
    #[serde(flatten)]
    pub paths: HashMap<String, String>,
}

impl Default for Alias {
    fn default() -> Self {
        Self { paths: [("@".to_string(), "./src".to_string())].into() }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct Define {
    #[serde(flatten)]
    pub variables: HashMap<String, String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct BundlessOptions {
    #[serde(default = "default_cwd")]
    pub cwd: PathBuf,
    pub format: ModuleType,
    pub sourcemap: bool,
    minify: bool,
    targets: serde_json::Value,
    shims: Shims,
    external_helpers: Option<bool>,
    #[serde(default = "default_alias")]
    pub alias: Option<Alias>,
    define: Option<Define>,
    pub css: Option<CSS>,
    pub react: React,
    out_ext: String,
    pub exclude: Vec<String>,
    //
    pub out_dir: Option<PathBuf>,
    pub src_dir: Option<PathBuf>,
    is_module: bool,
}

fn default_cwd() -> PathBuf {
    static CWD: LazyLock<PathBuf> = LazyLock::new(|| ::std::env::current_dir().unwrap());
    CWD.clone()
}

fn default_alias() -> Option<Alias> {
    Some(Alias::default())
}

fn default_jsx_runtime() -> Option<JsxRuntime> {
    Some(JsxRuntime::default())
}

impl Default for BundlessOptions {
    fn default() -> Self {
        let cwd = default_cwd();
        Self {
            cwd: cwd.clone(),
            format: Default::default(),
            sourcemap: Default::default(),
            minify: Default::default(),
            targets: Default::default(),
            alias: Some(Default::default()),
            shims: Default::default(),
            define: Default::default(),
            external_helpers: Default::default(),
            css: Default::default(),
            react: Default::default(),
            exclude: vec![],
            out_dir: Default::default(),
            out_ext: Default::default(),
            src_dir: Default::default(),
            is_module: Default::default(),
        }
    }
}

impl BundlessOptions {
    pub fn cwd<P: AsRef<Path>>(mut self, cwd: P) -> Self {
        self.cwd = cwd.as_ref().to_path_buf();
        self
    }

    pub fn format(mut self, format: ModuleType) -> Self {
        self.format = format;
        self
    }

    pub fn alias(mut self, alias: Alias) -> Self {
        self.alias = Some(alias);
        self
    }

    pub fn define(mut self, define: Define) -> Self {
        self.define = Some(define);
        self
    }

    pub fn external_helpers(mut self, external_helpers: bool) -> Self {
        self.external_helpers = Some(external_helpers);
        self
    }

    pub fn targets(mut self, targets: serde_json::Value) -> Self {
        self.targets = targets;
        self
    }

    pub fn css(mut self, css: CSS) -> Self {
        self.css = Some(css);
        self
    }

    pub fn react(mut self, react: React) -> Self {
        self.react = react;
        self
    }

    pub fn sourcemap(mut self, sourcemap: bool) -> Self {
        self.sourcemap = sourcemap;
        self
    }

    pub fn minify(mut self, minify: bool) -> Self {
        self.minify = minify;
        self
    }

    pub fn shims(mut self, shims: Shims) -> Self {
        self.shims = shims;
        self
    }

    pub fn is_module(mut self, is_module: bool) -> Self {
        self.is_module = is_module;
        self
    }

    pub fn out_dir(&self) -> PathBuf {
        let out = match &self.format {
            ModuleType::ESM => "es",
            ModuleType::CJS => "lib",
        };

        self.out_dir.clone().unwrap_or_else(|| self.cwd.join(out))
    }

    pub fn src_dir(&self) -> PathBuf {
        self.src_dir.clone().unwrap_or_else(|| self.cwd.join("src"))
    }

    pub fn out_ext(&self) -> String {
        get_out_ext(self, self.is_module)
    }
}

impl BundlessOptions {
    pub fn build_for_swc(&self) -> Result<Options> {
        let minify_options = if self.minify {
            // @refer: https://rspack.rs/plugins/rspack/swc-js-minimizer-rspack-plugin#minimizeroptions
            Some(serde_json::json!({
                "mangle": true,
                "compress": {
                    "passes": 2,
                },
                "format": {
                    "comments": false,
                },
            }))
        } else {
            None
        };
        let config_json = json!({
            "swcrc": false,
            "configFile": false,
            "sourceMaps": self.sourcemap,
            "minify": self.minify,
            "env": {
                "mode": "entry",
                "coreJs": "3",
                "targets": self.targets
            },
            "jsc": {
                // https://swc.rs/docs/configuration/compilation#jscexternalhelpers
                "externalHelpers": self.external_helpers,
                "parser": {
                    "syntax": "typescript",
                    "tsx": true,
                    "decorators": true
                },
                "baseUrl": self.cwd,
                "paths": self.alias_to_ts_path(),
                "transform": {
                    "legacyDecorator": true,
                    "decoratorMetadata": true,
                    "react": {
                        "runtime": self.react.jsx_runtime
                    },
                    "optimizer": {
                        // @swc/core@1.2.101+ 支持无需插件实现 @see https://swc.rs/docs/configuration/compilation#jsctransformoptimizerglobals
                        "globals": self.get_globals_from_define(),
                    }
                },
                // @refer: https://rspack.rs/plugins/rspack/swc-js-minimizer-rspack-plugin#minimizeroptions
                "minify": minify_options,
                "experimental": {
                    "cacheRoot": "node_modules/.cache/swc",
                    "plugins": self.get_plugins()
                }
            },
            "module": {
                "type": self.format.to_string(),
                "resolveFully": true,
                // node@14+ 支持在 cjs import(),无需转换
                // "ignoreDynamic": true, -> 导致 alias 无法生效
                // "outFileExtension": self.out_ext(),
            }
        });

        let config_str = config_json.to_string();
        serde_json::from_str::<Options>(&config_str).map_err(|e| {
            let miette_err = serde_error_to_miette(e, &config_str, "Could not parse swc config");
            anyhow::anyhow!("{:?}", miette_err)
        })
    }

    pub fn is_default_format(&self) -> bool {
        // 默认格式为 ESM 且是模块
        match (&self.format, &self.is_module) {
            (ModuleType::ESM, true) => true,
            (ModuleType::CJS, false) => true,
            _ => false,
        }
    }

    pub fn is_node(&self) -> bool {
        self.targets.get("node").is_some()
    }

    fn get_plugins(&self) -> Vec<serde_json::Value> {
        let plugins = vec![];

        // println!("bundless plugins: {:#?}", &plugins);

        plugins
    }

    // '@': './src'  -> '@/*': ['./src/*'],
    // '@': 'src'    -> '@/*': ['./src/*'],
    // '@': './src/' -> '@/*': ['./src/*'],
    fn alias_to_ts_path(&self) -> serde_json::Value {
        let mut paths = serde_json::Map::new();

        if let Some(alias) = &self.alias {
            for (name, path) in &alias.paths {
                paths.insert(
                    format!("{}/*", name),
                    json!([format!("{}/*", Self::format_path(path))]),
                );
            }
        }

        serde_json::Value::Object(paths)
    }

    fn format_path(path: &str) -> String {
        let mut formatted_path = path.trim_end_matches('/').to_string();

        if !formatted_path.starts_with('.') {
            formatted_path.insert_str(0, "./");
        }

        formatted_path
    }

    // webpack define 格式转换成 swc `jsc.transform.optimizer.globals` 配置
    // https://swc.rs/docs/configuration/compilation#jsctransformoptimizerglobals
    fn get_globals_from_define(&self) -> HashMap<String, serde_json::Value> {
        let (mut typeofs, mut vars) = (HashMap::new(), HashMap::new());

        if let Some(define) = &self.define {
            for (k, v) in &define.variables {
                if k.starts_with("typeof ") {
                    // 处理 "\"object\"" -> "object"
                    let value =
                        serde_json::from_str::<serde_json::Value>(v).unwrap_or_else(|_| json!(v));

                    typeofs.insert(k.trim_start_matches("typeof ").to_string(), value);
                } else {
                    vars.insert(k.clone(), json!(v));
                }
            }
        }

        let mut globals = HashMap::new();
        globals.insert("typeofs".to_string(), json!(typeofs));
        globals.insert("vars".to_string(), json!(vars));

        globals
    }
}
