use std::{path::Path, rc::Rc, sync::Arc};

use oxc_allocator::Allocator;

use miette::{diagnostic, miette, Error, LabeledSpan, Severity};
use oxc_linter::{
    AllowWarnDeny, ConfigStoreBuilder, FixKind, FrameworkFlags, LintFilter, LintFilterKind,
    LintOptions, LintPlugins, Linter, Oxlintrc,
};
use oxc_parser::Parser;
use oxc_semantic::SemanticBuilder;
use serde::Deserialize;

fn main() {
    // 示例代码
    let source_code = r#"
        function test() {
            debugger;

            switch (1) {
                case 1:
                    break;
            }
        }
    "#;

    let config: Oxlintrc = serde_json::from_value(serde_json::json!({ "plugins": [] })).unwrap();

    let res = Oxlintrc::deserialize(serde_json::json!({
      "$schema": "./node_modules/oxlint/configuration_schema.json",
      "plugins": ["import", "typescript", "unicorn"],
      "env": {
        "browser": true
      },
      "globals": {
        "foo": "readonly"
      },
      "settings": {},
      "rules": {
        "eqeqeq": "warn",
        "import/no-cycle": "error"
      },
      "overrides": [
        {
          "files": ["*.test.ts", "*.spec.ts"],
          "rules": {
            "@typescript-eslint/no-explicit-any": "off"
          }
        }
      ]
    }))
    .unwrap();

    // let filter = LintFilter::deny(LintFilterKind::try_from("no-debugger").unwrap());

    let filter = LintFilter::allow(LintFilterKind::try_from("no-debugger").unwrap());

    let config = ConfigStoreBuilder::default()
        // .and_plugins(LintPlugins::ESLINT, false)
        .with_filters(vec![filter])
        .build()
        .unwrap();

    let lint = Linter::new(
        LintOptions {
            fix: FixKind::None,
            framework_hints: FrameworkFlags::NextOnly,
        },
        config,
    );

    let p = Path::new(".");

    let allocator = Allocator::default();

    let source_type = oxc_span::SourceType::tsx();

    let parse = Parser::new(&allocator, &source_code, source_type).parse();

    let program = allocator.alloc(&parse.program);

    let semantic_return = SemanticBuilder::new()
        .with_check_syntax_error(false)
        // TODO 很多场景下是不需要开启的，只有 oxlint 下需要开启，这可能对性能会产生一定的影响
        .with_cfg(true)
        .build(program);

    let semantic = semantic_return.semantic;

    let module_record = Arc::new(oxc_linter::ModuleRecord::new(
        &p,
        &parse.module_record,
        &semantic,
    ));
    let semantic = Rc::new(semantic);

    let res = lint.run(&p, semantic, module_record);

    miette::set_hook(Box::new(|_| {
        Box::new(
            miette::MietteHandlerOpts::new()
                .color(true)
                .unicode(true)
                .build(),
        )
    }))
    .unwrap();

    for r in res {
        let spans = r.error.labels.clone().unwrap();

        let mut labels = vec![];

        let message = r.error.message.to_string();

        for span in spans {
            labels.push(LabeledSpan::at_offset(span.offset(), message.clone()));
        }

        let h = r.error.help.as_ref().unwrap().to_string();

        // println!("{:?}", r.error.severity);

        let x = r.error.code.number.as_ref().unwrap().to_string();

        let severity = match r.error.severity {
            oxc_diagnostics::Severity::Error => miette::Severity::Error,
            oxc_diagnostics::Severity::Warning => miette::Severity::Warning,
            oxc_diagnostics::Severity::Advice => miette::Severity::Advice,
        };

        let report = miette!(
            severity = severity,
            url = r.error.url.as_ref().unwrap().to_string(),
            labels = labels,
            help = h.as_str(),
            "{}",
            x
        )
        .with_source_code(source_code);

        eprintln!("{:?}", report);
    }
}
