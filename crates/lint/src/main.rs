#![recursion_limit = "512"]
use std::{path::Path, rc::Rc, sync::Arc};

use oxc_allocator::Allocator;

use miette::{diagnostic, miette, Error, LabeledSpan, Severity};
use oxc_linter::{
    rules::EslintDefaultCase, AllowWarnDeny, ConfigStoreBuilder, FixKind, FrameworkFlags,
    LintFilter, LintFilterKind, LintOptions, LintPlugins, Linter, Oxlintrc,
};
use oxc_parser::Parser;
use oxc_semantic::SemanticBuilder;
use serde::Deserialize;
use serde_json::{Map, Value};

fn get_eslint_rules() -> Map<String, Value> {
    include_str!("./eslint_warn.json")
        .parse::<serde_json::Value>()
        .ok()
        .and_then(|v| v.as_object().map(|m| m.to_owned()))
        .unwrap_or_default()
}

fn get_typescript_rules() -> Map<String, Value> {
    include_str!("./typescript.json")
        .parse::<serde_json::Value>()
        .ok()
        .and_then(|v| v.as_object().map(|m| m.to_owned()))
        .unwrap_or_default()
}

fn get_oxc_rules() -> Map<String, Value> {
    include_str!("./oxc.json")
        .parse::<serde_json::Value>()
        .ok()
        .and_then(|v| v.as_object().map(|m| m.to_owned()))
        .unwrap_or_default()
}

fn get_promise_rules() -> Map<String, Value> {
    include_str!("./promise.json")
        .parse::<serde_json::Value>()
        .ok()
        .and_then(|v| v.as_object().map(|m| m.to_owned()))
        .unwrap_or_default()
}

fn get_react_rules() -> Map<String, Value> {
    include_str!("./react.json")
        .parse::<serde_json::Value>()
        .ok()
        .and_then(|v| v.as_object().map(|m| m.to_owned()))
        .unwrap_or_default()
}

fn get_unicorn_rules() -> Map<String, Value> {
    include_str!("./unicorn.json")
        .parse::<serde_json::Value>()
        .ok()
        .and_then(|v| v.as_object().map(|m| m.to_owned()))
        .unwrap_or_default()
}

fn main() {
    // 示例代码
    let source_code = r#"
foo.join();
    "#;

    // let config: Oxlintrc = serde_json::from_value(serde_json::json!({ "plugins": [] })).unwrap();

    let eslint_rules = get_eslint_rules();
    let typescript_rules = get_typescript_rules();
    let oxc_rules = get_oxc_rules();
    let promise_rules = get_promise_rules();
    let react_rules = get_react_rules();
    let unicorn_rules = get_unicorn_rules();
    println!("{:?}", oxc_rules);

    let all_rules = {
        let mut rules = eslint_rules.clone();
        rules.extend(typescript_rules);
        rules.extend(oxc_rules);
        rules.extend(promise_rules);
        rules.extend(react_rules);
        rules.extend(unicorn_rules);
        // rules.extend(typescript_rules.as_object().unwrap().clone());
        rules
    };

    let res = Oxlintrc::deserialize(serde_json::json!({
      "$schema": "./node_modules/oxlint/configuration_schema.json",
      "plugins": ["import", "typescript", "unicorn","oxc","promise","react","react-perf"],
      "env": {
        "browser": true
      },
      "globals": {
        "foo": "readonly"
      },
      "settings": {},
      "rules":all_rules,
      "overrides": [
        {
          "files": ["*.test.ts", "*.spec.ts"],
          "rules": {

          }
        }
      ]
    }))
    .unwrap();

    let filter = LintFilter::deny(LintFilterKind::try_from("no-debugger").unwrap());

    // let filter = setup().unwrap();

    let config = ConfigStoreBuilder::from_oxlintrc(true, res)
        .build()
        .unwrap();

    // let config = ConfigStoreBuilder::default()
    //     // .and_plugins(LintPlugins::ESLINT, false)
    //     .with_filters(filter)
    //     .build()
    //     .unwrap();

    let lint = Linter::new(
        LintOptions {
            fix: FixKind::None,
            framework_hints: FrameworkFlags::NextOnly,
        },
        config,
    );

    let p = Path::new("./aA.ts");

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
        println!("{:?}", r.error);
        let message = r.error.message.to_string();

        for span in spans {
            // let lp = LabeledSpan::at_offset(span.offset(), message.clone());
            let lp = LabeledSpan::at(span.offset()..span.offset() + span.len(), message.clone());
            labels.push(lp);
        }

        let h = r
            .error
            .help
            .as_ref()
            .map_or("".to_string(), |s| s.to_string());

        // println!("{:?}", r.error.severity);

        let scope = r.error.code.scope.as_ref().unwrap().to_string();
        let number = r.error.code.number.as_ref().unwrap().to_string();

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
            "{}/{}",
            scope,
            number
        )
        .with_source_code(source_code);

        eprintln!("{:?}", report);
    }
}

fn setup() -> anyhow::Result<Vec<LintFilter>> {
    let x = vec![
        "for-direction",
        "no-async-promise-executor",
        "no-caller",
        "no-class-assign",
        "no-compare-neg-zero",
        "no-cond-assign",
        "no-const-assign",
        "no-constant-binary-expression",
    ];

    let res = x
        .iter()
        .filter_map(|s| {
            if let Ok(kind) = LintFilterKind::try_from(*s) {
                Some(LintFilter::deny(kind))
            } else {
                None
            }
        })
        .collect();

    Ok(res)
}
