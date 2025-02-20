#![recursion_limit = "256"]
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

            // Check the user's job title
if (user.name = "John") {  // 这里是赋值操作，而不是比较操作
    console.log("Hello John!");
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
        "for-direction": "error",
        "no-async-promise-executor": "error",
        "no-caller": "error",
        "no-class-assign": "error",
        "no-compare-neg-zero": "error",
        "no-cond-assign": ["error", "except-parens"],
        "no-const-assign":["error"],
        "no-constant-binary-expression":["error"],
        "no-constant-condition":["error","allExceptWhileTrue"],
        "no-control-regex":["error"],
        "no-debugger":["error"],
        "no-delete-var":["error"],
        "no-dupe-class-members":["error"],
        "no-dupe-else-if":["error"],
        "no-dupe-keys":["error"],
        "no-duplicate-case":["error"],
        "no-empty-character-class":["error"],
        "no-empty-pattern":["error",{"allowObjectPatternsAsParameters":false}],
        "no-empty-static-block":["error"],
        "no-ex-assign":["error"],
        "no-extra-boolean-cast":["error",{"enforceForLogicalOperands":false}],
        "no-func-assign":["error"],
        "no-global-assign":["error",{"exceptions":[]}],
        "no-import-assign":["error"],
        "no-invalid-regexp":["error",{"allowConstructorFlags":[]}],
        "no-irregular-whitespace":["error",{
            "skipStrings": true,     // 允许字符串中的特殊空格
            "skipComments": false,   // 不允许注释中的特殊空格
            "skipRegExps": true,     // 允许正则表达式中的特殊空格
            "skipTemplates": true,   // 允许模板中的特殊空格
            "skipJSXText": true      // 允许JSX文本中的特殊空格
        }],
        "no-loss-of-precision":["error"],
        "no-new-native-nonconstructor":["error"],
        "no-nonoctal-decimal-escape":["error"],
        "no-obj-calls":["error"],
        "no-self-assign":["error",{"props": true}],
        "no-setter-return":["error"],
        "no-shadow-restricted-names":["error"],
        "no-sparse-arrays":["error"],
        "no-this-before-super":["error"],
        "no-unsafe-finally":["error"],
        "no-unsafe-negation":["error",{"enforceForOrderingRelations":true}],
        "no-unsafe-optional-chaining":["error",{"disallowArithmeticOperators":true}],
        "no-unused-labels":["error"],
        "no-unused-private-class-members":["warn"],
        "no-unused-vars":["error",{
            "argsIgnorePattern":"^_",
            "varsIgnorePattern":"^_",
            "caughtErrorsIgnorePattern":"^_",
            "destructuredArrayIgnorePattern":"^_",
            "varsIgnorePattern":"^_",
            "caughtErrorsIgnorePattern":"^_",
            "destructuredArrayIgnorePattern":"^_"
        }],
        "no-useless-catch":["error"],
        "no-useless-escape":["error"],
        "no-useless-rename":["error",{
            "ignoreImport":false,
            "ignoreDestructuring":false,
            "ignoreExport":false
        }],
        "no-with":["error"],
        "require-yield":["error"],
        "use-isnan":["error",{
            "enforceForSwitchCase":true,
            "enforceForIndexOf":true,
        }],
        "valid-typeof":["error",{
            "requireStringLiterals":true
        }],
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

    let filter = setup().unwrap();

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
        println!("{:?}", r.error);
        let message = r.error.message.to_string();

        for span in spans {
            // let lp = LabeledSpan::at_offset(span.offset(), message.clone());
            let lp = LabeledSpan::at(span.offset()..span.offset() + span.len(), message.clone());
            labels.push(lp);
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
