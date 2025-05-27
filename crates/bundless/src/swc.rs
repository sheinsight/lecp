use anyhow::{Context, Result};
use log::debug;
use std::collections::HashMap;
use std::{path::Path, sync::Arc};
use swc_core::base::config::Options;
use swc_core::common::comments::SingleThreadedComments;
use swc_core::ecma::ast::noop_pass;
use swc_core::{
    base::{Compiler, TransformOutput, try_with_handler},
    common::{FileName, GLOBALS, SourceMap},
};

use crate::util::write_file;

// !options.config.error.filename -> skip_filename:true
// handler config
// swc_core::base::HandlerOpts {
//     skip_filename,
//     ..Default::default()
// },

pub fn parallel_transform_file(files: Vec<&Path>, options: &Options) -> Result<()> {
    use rayon::prelude::*;

    let res = files
        .into_par_iter()
        .map(|file| transform_file(file, options))
        .collect::<Result<Vec<_>>>()?;

    debug!("Successfully transformed {} files in parallel", res.len());
    for (i, output) in res.iter().enumerate() {
        debug!("File {}: {:?}", i, output);
    }

    Ok(())
}

pub fn transform_file(file: &Path, options: &Options) -> Result<TransformOutput> {
    let cm = Arc::<SourceMap>::default(); // cm -> code map
    let compiler = Compiler::new(cm.clone());

    // 计算 SyntaxContext
    GLOBALS
        .set(&Default::default(), || {
            try_with_handler(cm.clone(), Default::default(), |handler| {
                debug!("load file {:?}", file);

                let fm = cm.load_file(file).context("failed to load file")?;
                // compiler.process_js_file(fm, handler, options).context("failed to process file")
                compiler
                    .process_js_with_custom_pass(
                        fm,
                        None,
                        handler,
                        options,
                        SingleThreadedComments::default(),
                        |_| {
                            let mut extensions: HashMap<String, String> = HashMap::new();
                            let js_ext = "js"; //
                            extensions.insert("js".to_string(), js_ext.to_string());
                            extensions.insert("mjs".to_string(), js_ext.to_string());
                            extensions.insert("cjs".to_string(), js_ext.to_string());

                            let extensions_pass = swc_transform_extensions::transform(
                                swc_transform_extensions::Config { extensions },
                            );

                            extensions_pass
                        },
                        |_| noop_pass(),
                    )
                    .context("failed to process file")
            })
        })
        .map_err(|e| e.to_pretty_error())
}

pub fn transform(code: String, options: &Options) -> Result<TransformOutput> {
    println!("11111 transform code ");

    let cm = Arc::<SourceMap>::default(); // cm -> code map
    let compiler = Compiler::new(cm.clone());

    // 计算 SyntaxContext
    GLOBALS
        .set(&Default::default(), || {
            try_with_handler(cm.clone(), Default::default(), |handler| {
                let fm = compiler.cm.new_source_file(
                    if options.filename.is_empty() {
                        FileName::Anon.into()
                    } else {
                        FileName::Real(options.filename.clone().into()).into()
                    },
                    code.to_string(),
                );

                // compiler.process_js_file(fm, handler, &options)
                compiler.process_js_with_custom_pass(
                    fm,
                    None,
                    handler,
                    options,
                    SingleThreadedComments::default(),
                    |_| {
                        let ts2js_pass =
                            swc_transform_ts2js::transform(swc_transform_ts2js::Config {
                                preserve_import_extension: Default::default(),
                            });

                        let mut extensions: HashMap<String, String> = HashMap::new();
                        let js_ext = "js"; //
                        extensions.insert("js".to_string(), js_ext.to_string());
                        extensions.insert("mjs".to_string(), js_ext.to_string());
                        extensions.insert("cjs".to_string(), js_ext.to_string());

                        let shims_pass =
                            swc_transform_shims::transform(swc_transform_shims::Config {
                                legacy: true,
                                target: swc_transform_shims::Target::ESM,
                            });

                        (ts2js_pass, shims_pass)
                    },
                    |_| noop_pass(),
                )
            })
        })
        .map_err(|e| e.to_pretty_error())
}

pub fn write_file_and_sourcemap(output: TransformOutput, out_path: &Path) -> Result<()> {
    let mut code = output.code;
    // 处理 sourcemap
    if let Some(map) = output.map {
        let out_ext = out_path.extension().unwrap_or_default();
        let map_path = out_path.with_extension(format!("{}.map", out_ext.to_string_lossy()));
        // println!("Writing map file: {:?}", &map_path.strip_prefix(cwd)?);
        println!("Writing map file: {:?}", &map_path);

        code.push_str(&format!(
            "\n//# sourceMappingURL={}",
            &map_path.file_name().unwrap().to_string_lossy()
        ));

        write_file(map_path, map)?;
    }

    // 写入文件
    // println!("Writing     file: {:?}", &out_path.strip_prefix(cwd)?);
    println!("Writing     file: {:?}", &out_path);
    write_file(out_path, code)?;

    Ok(())
}

#[cfg(test)]
mod tests {

    // use crate::serde_error_to_miette;

    use super::*;

    // #[test]
    // fn test_transform_file() {
    //     let option_str: &'static str = r#"{
    //         "sourceMaps": true,
    //         "minify": true
    //     }"#;
    //     let options = serde_json::from_str::<Options>(option_str)
    //         .map_err(|e| serde_error_to_miette(e, option_str, "Could not parse swc options"))
    //         // .map_err(|e| e.to_string())
    //         .unwrap();

    //     let result = transform_file(Path::new("./transform-input.js"), &options);
    //     println!("Result: {:?}", result);
    //     assert!(result.is_ok());
    //     if let Ok(output) = result {
    //         println!("{:?}", output);
    //     }
    // }

    #[test]
    fn test_transform_file_not_found() {
        let result = transform_file(Path::new("./transform-input-404.js"), &Default::default());
        assert!(result.is_err());
        if let Err(err) = result {
            println!("{:?}", err);
        }
    }

    #[test]
    fn test_transform() {
        let code = "const a = 1;".to_string();
        let result = transform(code, &Default::default());
        assert!(result.is_ok());
        if let Ok(output) = result {
            println!("{:?}", output);
        }
    }

    #[test]
    fn test_transform_error() {
        let code = "cont a = 1;".to_string();
        let result = transform(code, &Default::default());
        assert!(result.is_err());
        if let Err(err) = result {
            println!("{:?}", err);
        }
    }

    #[test]
    fn test_transform_parallel() {
        let files: Vec<&Path> =
            vec!["./transform-input.js".as_ref(), "./transform-input.js".as_ref()];
        parallel_transform_file(files, &Default::default()).unwrap_or_else(|err| {
            println!("Error: {:?}", err);
        });
    }
}
