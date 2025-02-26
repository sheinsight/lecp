#![recursion_limit = "512"]
use std::{
    env::current_dir,
    fs,
    ops::Index,
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

use ptree::{
    print_config::{ASCII_CHARS_TICK, UTF_CHARS, UTF_CHARS_BOLD},
    print_tree_with, write_tree_with, Color, PrintConfig, Style, TreeBuilder,
};
use serde_json::json;

fn build_tree(path: &Path, tree: &mut TreeBuilder) -> std::io::Result<()> {
    if path.is_dir() {
        tree.begin_child(format!("{}/", path.file_name().unwrap().to_string_lossy()));

        let mut entries: Vec<_> = fs::read_dir(path)?.filter_map(|e| e.ok()).collect();

        // 排序确保输出一致
        entries.sort_by_key(|e| e.path());

        for entry in entries {
            build_tree(&entry.path(), tree)?;
        }

        tree.end_child();
    } else {
        tree.add_empty_child(path.file_name().unwrap().to_string_lossy().to_string());
    }

    Ok(())
}

fn test_tree() -> std::io::Result<()> {
    let mut tree = TreeBuilder::new(String::from("."));
    let cwd = current_dir().unwrap().join("examples/demo-component/src");
    build_tree(&cwd, &mut tree)?;

    let tree = tree.build();

    let config = {
        let mut config = PrintConfig::from_env();
        config.branch = Style {
            // foreground: Some(Color::Red),
            // background: Some(Color::Yellow),
            // dimmed: true,
            bold: false,
            ..Style::default()
        };
        config.leaf = Style {
            bold: false,
            ..Style::default()
        };
        config.characters = UTF_CHARS.into();
        config.indent = 4;
        config
    };

    // print_tree_with(&tree, &config).expect("Error printing tree");

    let mut res = Vec::new();
    write_tree_with(&tree, &mut res, &config).expect("Error writing tree");
    let tree_str = String::from_utf8(res).unwrap();
    // println!("{} {}", tree_str, tree_str.find("Demo.less").unwrap());

    let file_name = "Demo.less";
    let index = tree_str.find(file_name).unwrap();

    let report = miette!(
        severity = miette::Severity::Error,
        code = "lego/duplicate-file-names",
        help = "Check for duplicate file names",
        labels = vec![
            LabeledSpan::at(
                index..index + file_name.len(),
                "Duplicate file names, different suffixes"
            ),
            // LabeledSpan::at(122..130, "Duplicate file names, different suffixes"),
        ],
        "Duplicate file names",
    )
    .with_source_code(tree_str);

    eprintln!("{:?}", report);

    Ok(())
}

fn lint() {
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
}

fn main() {
    test_tree().unwrap();

    // lint();

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
