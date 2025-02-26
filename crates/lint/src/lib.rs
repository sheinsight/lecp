#![recursion_limit = "512"]
use std::{path::PathBuf, rc::Rc, sync::Arc};

use environments::Environments;
use oxc_allocator::Allocator;
use oxc_linter::{ConfigStoreBuilder, FixKind, FrameworkFlags, LintOptions, LintPlugins, Oxlintrc};
use oxc_parser::Parser;
use oxc_semantic::SemanticBuilder;
use rayon::prelude::*;
use rules::{
    eslint::EslintRuleGetter, oxc::OxcRuleGetter, promise::PromiseRuleGetter,
    react::ReactRuleGetter, rule_getter::RuleGetter, typescript::TypescriptRuleGetter,
    unicorn::UnicornRuleGetter,
};
use rustc_hash::FxHashMap;
use serde_json::json;
use std::borrow::Cow;
use wax::Glob;

pub mod environments;
pub mod rule_builder;
pub mod rules;

pub struct Linter {
    cwd: PathBuf,
    envs: Environments,
    plugins: LintPlugins,
}

// react-component
// react-component-esm
// react-component-commonjs

#[derive(Debug)]
pub struct MietteReport {
    pub scope: Option<String>,
    pub number: Option<String>,
    pub severity: miette::Severity,
    pub url: Option<Cow<'static, str>>,
    pub labels: Vec<miette::LabeledSpan>,
    pub help: Option<Cow<'static, str>>,
    pub source_code: String,
    pub path: PathBuf,
}

impl Linter {
    pub fn new(cwd: PathBuf, envs: Environments, plugins: LintPlugins) -> Self {
        Self { cwd, envs, plugins }
    }

    // pub fn with_rules(&mut self, rules: Vec<Box<dyn rules::Rule>>) -> Self {
    //     self
    // }

    // pub fn with_plugins(&mut self, plugins: LintPlugins) -> Self {
    //     self.plugins = plugins;
    //     self
    // }

    // pub fn with_env(&mut self, env: Environments) -> Self {
    //     self.envs = env;
    //     self
    // }

    fn source_type_from_path(path: &std::path::Path) -> oxc_span::SourceType {
        match path.extension().and_then(|ext| ext.to_str()) {
            Some("ts") => oxc_span::SourceType::ts(),
            Some("tsx") => oxc_span::SourceType::tsx(),
            Some("jsx") => oxc_span::SourceType::jsx(),
            Some("cjs") => oxc_span::SourceType::cjs(),
            _ => oxc_span::SourceType::jsx(),
        }
    }

    fn convert_severity(severity: oxc_diagnostics::Severity) -> miette::Severity {
        match severity {
            oxc_diagnostics::Severity::Error => miette::Severity::Error,
            oxc_diagnostics::Severity::Warning => miette::Severity::Warning,
            oxc_diagnostics::Severity::Advice => miette::Severity::Advice,
        }
    }

    pub fn build(&self) -> anyhow::Result<Vec<MietteReport>> {
        let envs: FxHashMap<String, bool> = self.envs.to_hash_map();

        let is_dev = true;

        let overrides = if is_dev {
            json!([{
                "files": ["*.test.ts", "*.spec.ts","*.js","*.jsx","*.ts","*.tsx"],
                "rules": EslintRuleGetter::get_dev_override_rules()
            }])
        } else {
            json!([]) // 生产环境下使用空数组
        };

        let mut eslint = EslintRuleGetter::get_def_rules()
            .as_object()
            .unwrap()
            .to_owned();
        let oxc = OxcRuleGetter::get_def_rules()
            .as_object()
            .unwrap()
            .to_owned();
        let promise = PromiseRuleGetter::get_def_rules()
            .as_object()
            .unwrap()
            .to_owned();
        let react = ReactRuleGetter::get_def_rules()
            .as_object()
            .unwrap()
            .to_owned();
        let typescript = TypescriptRuleGetter::get_def_rules()
            .as_object()
            .unwrap()
            .to_owned();
        let unicorn = UnicornRuleGetter::get_def_rules()
            .as_object()
            .unwrap()
            .to_owned();

        eslint.extend(oxc);
        eslint.extend(promise);
        eslint.extend(react);
        eslint.extend(typescript);
        eslint.extend(unicorn);

        let merged = serde_json::to_value(eslint).unwrap();

        let rc = serde_json::from_value::<Oxlintrc>(json!({
            "plugins": ["import", "typescript", "unicorn","oxc","promise","react","react-perf"],
            "env": {
              "browser": true
            },
            "globals": {
              "foo": "readonly"
            },
            "settings": {},
            "rules": merged,
            "overrides":overrides
        }))?;

        let config = ConfigStoreBuilder::from_oxlintrc(true, rc).build()?;

        // println!("{}", serde_json::to_string_pretty(&rc).unwrap());

        let lint = oxc_linter::Linter::new(
            LintOptions {
                fix: FixKind::None,
                framework_hints: FrameworkFlags::NextOnly,
            },
            config,
        );

        let glob = Glob::new("**/*.{js,jsx,ts,tsx,cjs,mjs,cts,mts}")?;

        let entries = glob.walk(self.cwd.as_path()).not(vec![
            "**/node_modules/**",
            "node_modules",
            "**/dist/**",
            "**/*.d.ts",
        ])?;

        let res = entries
            .par_bridge()
            .filter_map(Result::ok)
            .map(|walk_entry| walk_entry.path().to_owned())
            .filter(|path| path.is_file())
            .map(|path| {
                if let Ok(source_code) = std::fs::read_to_string(&path) {
                    let allocator = Allocator::default();
                    let source_type = Self::source_type_from_path(&path);
                    let parser = Parser::new(&allocator, &source_code, source_type);
                    let parser_return = parser.parse();
                    let program = allocator.alloc(&parser_return.program);
                    let semantic_builder_return = SemanticBuilder::new()
                        .with_check_syntax_error(false)
                        .with_cfg(true)
                        .build(program);
                    let semantic = semantic_builder_return.semantic;
                    let module_record = Arc::new(oxc_linter::ModuleRecord::new(
                        &path,
                        &parser_return.module_record,
                        &semantic,
                    ));
                    let semantic = Rc::new(semantic);
                    let res = lint.run(&path, semantic, module_record);
                    res.into_iter()
                        .map(|message| {
                            let labels = message.error.labels.as_ref().map_or(vec![], |labels| {
                                labels
                                    .iter()
                                    .map(|label| {
                                        miette::LabeledSpan::at(
                                            label.offset()..label.offset() + label.len(),
                                            message.error.message.clone(),
                                        )
                                    })
                                    .collect()
                            });

                            let url = message.error.url.as_ref().map(|url| url.to_owned());
                            let help = message.error.help.as_ref().map(|help| help.to_owned());
                            let scope = message
                                .error
                                .code
                                .scope
                                .as_ref()
                                .map(|scope| scope.to_string());
                            let number = message
                                .error
                                .code
                                .number
                                .as_ref()
                                .map(|number| number.to_string());

                            MietteReport {
                                severity: Self::convert_severity(message.error.severity),
                                url,
                                labels,
                                help,
                                source_code: source_code.to_owned(),
                                scope,
                                number,
                                path: path.to_owned(),
                            }
                        })
                        .collect::<Vec<_>>()
                } else {
                    println!("read file error {:?}", path);
                    vec![]
                }
            })
            .flatten()
            .collect::<Vec<_>>();

        Ok(res)
    }
}
