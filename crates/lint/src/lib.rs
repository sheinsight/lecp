#![recursion_limit = "512"]
use std::{
    path::{Path, PathBuf},
    rc::Rc,
    sync::Arc,
};

use config_builder::ConfigBuilder;
use environments::EnvironmentFlags;
use miette::{miette, NamedSource};
use oxc_allocator::Allocator;
use oxc_diagnostics::OxcDiagnostic;
use oxc_linter::{ConfigStoreBuilder, FixKind, FrameworkFlags, LintOptions, Oxlintrc};
use oxc_parser::Parser;
use oxc_semantic::SemanticBuilder;
use rules::{react_config::ReactConfig, typescript_config::TypescriptConfig};

use serde_json::{Map, Value};
use std::borrow::Cow;

pub mod config_builder;
pub mod environments;
pub mod lint_mode;
pub mod rules;

pub struct Linter {
    config_builder: ConfigBuilder,
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

impl Default for Linter {
    fn default() -> Self {
        Self {
            config_builder: ConfigBuilder::default(),
        }
    }
}

impl Linter {
    pub fn with_define(mut self, define: Map<String, Value>) -> Self {
        self.config_builder = self.config_builder.with_define(define);
        self
    }

    pub fn with_react(mut self, react: ReactConfig) -> Self {
        self.config_builder = self.config_builder.with_react(react);
        self
    }

    pub fn with_typescript(mut self, ts: TypescriptConfig) -> Self {
        self.config_builder = self.config_builder.with_typescript(ts);
        self
    }

    pub fn with_envs(mut self, envs: EnvironmentFlags) -> Self {
        self.config_builder = self.config_builder.with_envs(envs);
        self
    }
}

impl Linter {
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

    fn convert_severity(severity: oxc_diagnostics::Severity) -> miette::Severity {
        match severity {
            oxc_diagnostics::Severity::Error => miette::Severity::Error,
            oxc_diagnostics::Severity::Warning => miette::Severity::Warning,
            oxc_diagnostics::Severity::Advice => miette::Severity::Advice,
        }
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

    pub fn lint<P: AsRef<Path>>(&self, path: P) -> anyhow::Result<()> {
        let path = path.as_ref();

        let Ok(source_code) = std::fs::read_to_string(&path) else {
            return Err(anyhow::anyhow!("Failed to read file: {}", path.display()));
        };

        let rc = self.config_builder.build()?;

        // println!("-->rc: {}", serde_json::to_string(&rc).unwrap());

        let config = ConfigStoreBuilder::from_oxlintrc(true, rc).build().unwrap();

        let lint = oxc_linter::Linter::new(
            LintOptions {
                fix: FixKind::None,
                framework_hints: FrameworkFlags::empty(),
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
            if message.error.severity == oxc_diagnostics::Severity::Error {
                return Err(anyhow::anyhow!("Failed to lint file: {}", path.display()));
            }
        }

        Ok(())
    }
}
