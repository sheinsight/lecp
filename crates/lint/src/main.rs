#![recursion_limit = "512"]
use std::{
    env::current_dir,
    path::{Path, PathBuf},
    rc::Rc,
    sync::Arc,
    time::Instant,
};

use lint::{
    environments::Environments,
    rules::{eslint::EslintRuleGetter, rule_getter::RuleGetter},
    Linter,
};
use oxc_allocator::Allocator;

use miette::{miette, LabeledSpan};

use oxc_linter::LintPlugins;
use oxc_parser::Parser;
use oxc_semantic::SemanticBuilder;

use serde_json::json;

fn main() {
    // 统计执行耗时
    let start = Instant::now();

    let cwd = current_dir().unwrap();

    let linter = Linter::new(cwd, Environments::default(), LintPlugins::default());

    let res = linter.build().unwrap();

    for report in res {
        let report = miette!(
            severity = report.severity,
            url = report.url.as_ref().unwrap().to_string(),
            labels = report.labels,
            help = report
                .help
                .as_ref()
                .map_or_else(|| "".to_string(), |help| help.to_string()),
            "{}/{}",
            report.scope.as_ref().unwrap(),
            report.number.as_ref().unwrap()
        )
        .with_source_code(report.source_code);

        eprintln!("{:?}", report);
    }

    let end = Instant::now();

    println!("执行耗时: {:?}", end - start);

    //     let report = miette!(
    //         severity = miette::Severity::Error,
    //         code = "lego/duplicate-file-names",
    //         help = "Check for duplicate file names",
    //         labels = vec![
    //             LabeledSpan::at(91..99, "Duplicate file names, different suffixes"),
    //             LabeledSpan::at(122..130, "Duplicate file names, different suffixes"),
    //         ],
    //         "Duplicate file names",
    //     )
    //     .with_source_code(
    //         r#"
    // .
    // └── pages
    //     └── orders
    //         └── components
    //             ├── hello.js
    //             └── hello.ts
    // "#,
    //     );

    //     eprintln!("{:?}", report);
}
