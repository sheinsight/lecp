mod options;
mod swc;
mod util;
pub use crate::options::{BundlessOptions, CSS, Define, JsxRuntime, ModuleType, React, Shims};
pub use crate::util::serde_error_to_miette;

use anyhow::Result;
use log::debug;
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

pub fn bundless_js<P: AsRef<Path>>(cwd: P, options: &BundlessOptions) -> Result<()> {
    let cwd = cwd.as_ref();
    println!("Bundless CLI: {:?}", cwd);

    let src_dir = options.src_dir();
    let out_dir = options.out_dir();

    let out_ext = options.out_ext();
    // let is_default_format = options.is_default_format();

    let swc_options = options.build_for_swc()?;

    // println!("bundless default options: {:#?}", BundlessOptions::default());
    println!("bundless options: {:#?}", &options);
    println!("swc options: {:#?}", &swc_options);

    let ignore = std::iter::once("**/*.d.ts")
        .chain(options.exclude.iter().map(|s| s.as_str()))
        .collect::<Vec<_>>();

    debug!("ignore: {:?}", ignore);

    let glob: Glob<'_> = Glob::new("**/*.{ts,tsx,cts,mts,js,jsx,cjs,mjs}")?;
    glob.walk(&src_dir)
        .not(ignore)?
        .par_bridge()
        .filter_map(Result::ok)
        .map(|entry| entry.path().to_owned())
        .try_for_each(|path| {
            let out_path = get_out_file_path(&path, &src_dir, &out_dir, &out_ext)?;
            let output = transform_file(&path, &swc_options, &options)?;
            write_file_and_sourcemap(output, &out_path)
        })?;

    Ok(())
}
