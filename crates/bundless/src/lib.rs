mod options;
mod swc;
mod util;
pub use crate::options::{BundlessOptions, CSS, Define, JsxRuntime, React, Shims};
use crate::swc::transform_write_file;
pub use crate::util::serde_error_to_miette;

use anyhow::Result;
use rayon::prelude::*;
use std::path::Path;
use wax::Glob;

pub fn bundless_js<P: AsRef<Path>>(cwd: P, options: &BundlessOptions) -> Result<()> {
    let cwd = cwd.as_ref();
    println!("Bundless CLI: {:?}", cwd);

    println!("bundless raw options: {:#?}", &options);

    let src_dir = cwd.join("src");
    let out_dir = cwd.join("dist");

    let out_ext = String::from("cjs"); //

    let swc_options = options.build_for_swc()?;

    // println!("bundless default options: {:#?}", BundlessOptions::default());
    println!("bundless options: {:#?}", &options);
    // println!("swc options: {:#?}", &swc_options);

    let glob: Glob<'_> = Glob::new("**/*.{ts,tsx}")?;
    glob.walk(&src_dir)
        .not(Glob::new("**/*.d.ts"))?
        .par_bridge()
        .filter_map(Result::ok)
        .map(|entry| entry.path().to_owned())
        .try_for_each(|path| -> Result<(), anyhow::Error> {
            transform_write_file(&path, &swc_options, &src_dir, &out_dir, &out_ext, cwd)
        })?;

    Ok(())
}
