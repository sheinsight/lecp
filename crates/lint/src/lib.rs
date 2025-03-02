#![recursion_limit = "512"]
use std::{
    path::{Path, PathBuf},
    rc::Rc,
    sync::Arc,
};

use environments::Environments;
use lint_mode::LintMode;
use miette::{miette, NamedSource};
use oxc_allocator::Allocator;
use oxc_diagnostics::OxcDiagnostic;
use oxc_linter::{ConfigStoreBuilder, FixKind, FrameworkFlags, LintOptions, LintPlugins, Oxlintrc};
use oxc_parser::Parser;
use oxc_semantic::SemanticBuilder;
use rules::{
    eslint::EslintRuleGetter,
    oxc::OxcRuleGetter,
    promise::PromiseRuleGetter,
    react::{ReactConfig, ReactRuleGetter},
    react_perf::ReactPerfRuleGetter,
    rule_getter::RuleGetter,
    typescript::{TypescriptConfig, TypescriptRuleGetter},
    unicorn::UnicornRuleGetter,
};

use serde_json::{json, Map, Value};
use std::borrow::Cow;

pub mod environments;
pub mod lint_mode;
pub mod rule_builder;
pub mod rules;

pub struct Linter {
    envs: Environments,
    plugins: LintPlugins,
    mode: LintMode,
    define: Map<String, Value>,
    react: Option<ReactConfig>,
    ts: Option<TypescriptConfig>,
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
    pub fn new(mode: LintMode, envs: Environments, plugins: LintPlugins) -> Self {
        Self {
            envs,
            plugins,
            mode,
            define: Map::new(),
            react: None,
            ts: None,
        }
    }

    pub fn with_define(mut self, define: Map<String, Value>) -> Self {
        self.define = define;
        self
    }

    fn get_def_plugins(&self) -> Vec<Value> {
        serde_json::to_value(
            LintPlugins::ESLINT
                | LintPlugins::UNICORN
                | LintPlugins::IMPORT
                | LintPlugins::PROMISE
                | LintPlugins::OXC,
        )
        .unwrap_or(Value::Array(vec![]))
        .as_array()
        .map_or(vec![], |v| v.to_owned())
    }

    fn get_def_rules(&self) -> Map<String, Value> {
        let eslint = EslintRuleGetter::new().get_def_rules();
        let oxc = OxcRuleGetter::new().get_def_rules();
        let promise = PromiseRuleGetter::new().get_def_rules();
        let unicorn = UnicornRuleGetter::new().get_def_rules();
        let mut merged = Map::new();
        merged.extend(eslint);
        merged.extend(oxc);
        merged.extend(promise);
        merged.extend(unicorn);
        merged
    }

    fn source_type_from_path<P: AsRef<Path>>(&self, path: P) -> oxc_span::SourceType {
        match path.as_ref().extension().and_then(|ext| ext.to_str()) {
            Some("ts") | Some("cts") | Some("mts") => oxc_span::SourceType::ts(),
            Some("tsx") => oxc_span::SourceType::tsx(),
            Some("jsx") => oxc_span::SourceType::jsx(),
            Some("cjs") => oxc_span::SourceType::cjs(),
            Some("mjs") => oxc_span::SourceType::mjs(),
            _ => oxc_span::SourceType::mjs(),
        }
    }

    fn get_overrides(&self) -> Vec<Value> {
        let mut overrides = json!([])
            .as_array()
            .map_or(vec![], |overrides| overrides.to_owned());

        if let Some(ts) = &self.ts {
            let ts_rules = TypescriptRuleGetter::new(ts.clone()).get_def_rules();

            let ts_plugins = serde_json::to_value(LintPlugins::TYPESCRIPT)
                .unwrap_or(Value::Array(vec![]))
                .as_array()
                .map_or(vec![], |plugins| plugins.to_owned());

            overrides.push(json!({
                "files": ["*.ts", "*.tsx", "*.cts", "*.mts"],
                "plugins": ts_plugins,
                "rules": ts_rules,
            }));
        }

        if let Some(react) = &self.react {
            let mut react_rules = ReactRuleGetter::new(react.clone()).get_def_rules();
            react_rules.extend(ReactPerfRuleGetter::new().get_def_rules());

            let react_plugins = serde_json::to_value(LintPlugins::REACT | LintPlugins::REACT_PERF)
                .unwrap_or(Value::Array(vec![]))
                .as_array()
                .map_or(vec![], |plugins| plugins.to_owned());

            overrides.push(json!({
                "files": ["*.jsx", "*.tsx"],
                "plugins": react_plugins,
                "rules": react_rules,
            }));
        }

        overrides
    }

    fn convert_severity(severity: oxc_diagnostics::Severity) -> miette::Severity {
        match severity {
            oxc_diagnostics::Severity::Error => miette::Severity::Error,
            oxc_diagnostics::Severity::Warning => miette::Severity::Warning,
            oxc_diagnostics::Severity::Advice => miette::Severity::Advice,
        }
    }

    fn get_linter_config(&self) -> Oxlintrc {
        let def_plugin = self.get_def_plugins();
        let def_rules = self.get_def_rules();
        let overrides = self.get_overrides();

        serde_json::from_value::<Oxlintrc>(json!({
            "plugins": def_plugin,
            "env": self.envs.to_hash_map(),
            "globals": self.define,
            "settings": {},
            "rules": def_rules,
            "overrides":overrides
        }))
        .unwrap()
    }

    pub fn render_report(&self, source_code: NamedSource<String>, diagnostic: &OxcDiagnostic) {
        let url = diagnostic
            .url
            .as_ref()
            .map_or(String::new(), |url| url.to_string());
        let help = diagnostic
            .help
            .as_ref()
            .map_or(String::new(), |help| help.to_string());
        let scope = diagnostic
            .code
            .scope
            .as_ref()
            .map(|scope| scope.to_string());

        let number = diagnostic
            .code
            .number
            .as_ref()
            .map(|number| number.to_string());

        let labels = diagnostic.labels.as_ref().map_or(vec![], |labels| {
            labels
                .iter()
                .map(|label| {
                    let start = label.offset();
                    let end = start + label.len();
                    let label = label
                        .label()
                        .map_or(diagnostic.message.clone().to_string(), |label| {
                            label.to_string()
                        });
                    miette::LabeledSpan::at(start..end, label)
                })
                .collect()
        });

        let severity = Self::convert_severity(diagnostic.severity);

        let report = miette!(
            severity = severity,
            url = url,
            labels = labels,
            help = help,
            "{}/{}: {}",
            scope.unwrap_or_default(),
            number.unwrap_or_default(),
            diagnostic.message
        )
        .with_source_code(source_code);

        eprintln!("{:?}", report);
    }

    pub fn lint<P: AsRef<Path>>(&self, path: P) -> anyhow::Result<Vec<MietteReport>> {
        let path = path.as_ref();

        let Ok(source_code) = std::fs::read_to_string(&path) else {
            return Err(anyhow::anyhow!("Failed to read file: {}", path.display()));
        };

        let rc = self.get_linter_config();

        let config = ConfigStoreBuilder::from_oxlintrc(true, rc).build().unwrap();

        let lint = oxc_linter::Linter::new(
            LintOptions {
                fix: FixKind::Fix,
                framework_hints: FrameworkFlags::React,
            },
            config,
        );

        let allocator = Allocator::default();
        let source_type = self.source_type_from_path(&path);
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

        for message in res {
            let source = NamedSource::new(path.to_string_lossy().to_string(), source_code.clone());

            self.render_report(source, &message.error);

            // let error = message.error.with_source_code(source);

            // let handler =
            //     GraphicalReportHandler::new_themed(GraphicalTheme::ascii()).with_cause_chain();
            // let mut output = String::new();

            // handler.render_report(&mut output, error.as_ref()).unwrap();

            // println!("{}", output);
        }

        Ok(vec![])
    }
}
