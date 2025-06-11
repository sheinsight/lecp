mod options;
mod swc;
mod util;
pub use crate::options::{BundlessOptions, CSS, Define, JsxRuntime, ModuleType, React, Shims};
pub use crate::util::serde_error_to_miette;

use anyhow::Result;
use log::debug;
use owo_colors::OwoColorize;
use rayon::prelude::*;
use std::path::Path;
use swc::{transform_file, write_file_and_sourcemap};
use wax::Glob;

/**
 * |     | module | commonjs |
 * | --- | ------ | -------- |
 * | esm | .js     | .mjs    |
 * | cjs | .cjs    | .js     |
 *
 * @description
 * - target: browser 不处理后缀
 * - target: node 处理后缀
 * - is_module: package.json type
 */
fn get_out_ext(options: &BundlessOptions, is_module: bool) -> String {
    if !options.is_node() {
        return "js".to_string();
    }

    match (&options.format, is_module) {
        (ModuleType::ESM, false) => "mjs",
        (ModuleType::CJS, true) => "cjs",
        _ => "js",
    }
    .to_string()
}

// cwd: /demo
// path: /demo/src/utils/index.ts
// src_dir: /demo/src
// out_dir: /demo/dist
// out_path: /demo/dist/utils/index.js
pub fn get_out_file_path<P1: AsRef<Path>, P2: AsRef<Path>, P3: AsRef<Path>>(
    path: P1,
    src_dir: P2,
    out_dir: P3,
    out_ext: &str,
) -> Result<std::path::PathBuf> {
    let path = path.as_ref();
    let src_dir = src_dir.as_ref();
    let out_dir = out_dir.as_ref();

    // "jsx" | "tsx" => "js",
    let is_jsx_file = path.extension().map_or(false, |ext| ext == "jsx" || ext == "tsx");
    let out_ext = if is_jsx_file { "js" } else { out_ext };

    let rel_path = path.strip_prefix(src_dir)?;
    let out_path = out_dir.join(rel_path.with_extension(out_ext));

    debug!("out_path: {:?}", out_path);

    Ok(out_path)
}

pub fn bundless_files(options: &BundlessOptions) -> Result<()> {
    // let cwd = &options.cwd;
    // println!("Bundless CLI: {:?}", cwd);

    let src_dir = options.src_dir();
    let swc_options = options.build_for_swc()?;

    debug!("bundless options: {:#?}", &options);
    debug!("swc options: {:#?}", &swc_options);

    // 测试相关文件(glob格式)
    // wax crate 不支持某些高级的 glob 语法，特别是 {,/**} 这种大括号扩展和 **/*.+(test|e2e|spec).* 这种扩展模式。
    let test_pattern = vec![
        "**/fixtures",
        "**/fixtures/**",
        "**/demos",
        "**/demos/**",
        "**/mocks",
        "**/mocks/**",
        "**/__test__",
        "**/__test__/**",
        "**/__snapshots__",
        "**/__snapshots__/**",
        "**/*.test.*",
        "**/*.e2e.*",
        "**/*.spec.*",
    ];

    let ignore: Vec<&str> = ["**/*.d.ts"]
        .iter()
        .copied()
        .chain(options.exclude.iter().map(|s| s.as_str()))
        .chain(test_pattern.iter().copied())
        .collect();

    debug!("ignore: {:?}", ignore);

    // println!(
    //     "\nbundless for {} to {} with {} and dts\n",
    //     src_dir.strip_prefix(cwd)?.display().yellow(),
    //     options.format.get_type().yellow(),
    //     options.sourcemap.then(|| "sourcemap").unwrap_or_else(|| "no sourcemap")
    // );

    let glob: Glob<'_> = Glob::new("**/*.{ts,tsx,cts,mts,js,jsx,cjs,mjs}")?;
    glob.walk(&src_dir)
        .not(ignore)?
        .par_bridge()
        .filter_map(Result::ok)
        .map(|entry| entry.path().to_owned())
        .try_for_each(|path| bundless_file(path, options))?;

    Ok(())
}

pub fn bundless_file<P: AsRef<Path>>(file: P, options: &BundlessOptions) -> Result<()> {
    let file = file.as_ref();
    let cwd = &options.cwd;

    if !file.exists() {
        return Err(anyhow::anyhow!("File does not exist: {:?}", file));
    }

    let src_dir = options.src_dir();
    let out_dir = options.out_dir();
    let out_ext = options.out_ext();
    let swc_options = options.build_for_swc()?;

    let out_path = get_out_file_path(file, &src_dir, &out_dir, &out_ext)?;
    let output = transform_file(file, &swc_options, &options)?;

    println!(
        " bundless({}) {} to {}",
        options.format.get_type(),
        &file.strip_prefix(cwd)?.display().yellow(),
        &out_path.strip_prefix(cwd)?.display().bright_black()
    );
    write_file_and_sourcemap(output, &out_path)?;

    Ok(())
}
