use anyhow::{Context, Result};
use log::debug;
use rayon::prelude::*;
use serde_json::json;
use std::{fs, path::Path, sync::Arc};
use swc_core::base::config::Options;
use swc_core::{
    base::{try_with_handler, Compiler, TransformOutput},
    common::{FileName, SourceMap, GLOBALS},
};
use wax::Glob;

pub fn transform_file(file: &Path, options: &Options) -> Result<TransformOutput> {
    let cm = Arc::<SourceMap>::default(); // cm -> code map
    let compiler = Compiler::new(cm.clone());

    // 计算 SyntaxContext
    GLOBALS
        .set(&Default::default(), || {
            try_with_handler(cm.clone(), Default::default(), |handler| {
                debug!("load file {:?}", file);

                let file = cm.load_file(file).context("failed to load file")?;
                compiler.process_js_file(file, handler, options).context("failed to process file")
            })
        })
        .map_err(|e| e.to_pretty_error())
}

pub fn bundless_js<P: AsRef<Path>>(cwd: P) -> Result<()> {
    let cwd = cwd.as_ref();
    println!("Bundless CLI: {:?}", cwd);

    let src_dir = cwd.join("src");
    let out_dir = cwd.join("dist");

    let targets = json!({"chrome": "55"});
    let source_map = true;
    let minify = false;

    let out_ext = String::from("cjs");

    let config_json = json!({
        "swcrc":false,
        "configFile": false,
        "sourceMaps": source_map,
        "minify": minify,
        "env": {
            "mode": "entry",
            "coreJs": "3",
            "targets": targets
        },
        "jsc": {
            "externalHelpers": false,
            "parser": {
                "syntax": "typescript",
                "tsx": true,
                "decorators": true
            },
            "baseUrl": cwd.to_string_lossy(),
            "paths": {
                "@/*": ["./src/*"]
            },
            "transform": {
                "legacyDecorator": true,
                "decoratorMetadata": true,
                "react": {
                    "runtime": "automatic"
                },
                "optimizer": {
                    // @swc/core@1.2.101+ 支持无需插件实现 @see https://swc.rs/docs/configuration/compilation#jsctransformoptimizerglobals
                    "globals": {
                        "typeofs": {},
                        "vars": {},
                        "envs": {}
                    }
                }
            },
            "experimental": {
                "cacheRoot": "node_modules/.cache/swc",
                "plugins": []
            }
        },
        "module": {
            "type": "commonjs",// es6,commonjs,nodenext,umd
            "resolveFully": true,
            "outFileExtension": out_ext, // swc_core@v9.0.0, @swc/core@v1.10.1 支持
        }
    });

    let config_str = config_json.to_string();
    let options = serde_json::from_str::<Options>(&config_str)
        .map_err(|e| serde_error_to_miette(e, &config_str, "Could not parse swc config"))
        .map_err(|e| anyhow::anyhow!("{:?}", e))?;

    println!("Options: {:#?}", &options);

    let glob: Glob<'_> = Glob::new("**/*.{ts,tsx}")?;
    glob.walk(&src_dir)
        .not(Glob::new("**/*.d.ts"))?
        .par_bridge()
        .filter_map(Result::ok)
        .map(|entry| entry.path().to_owned())
        .map(|path| {
            let res = transform_file(&path, &options);

            res.and_then(|mut output| {
                // println!("Transforming file: {:?}", output.code);
                // println!("Transforming file: {:?}", output.map);
                // println!("Transforming file: {:#?}", output);

                let out_path = get_out_file_path(&path, &src_dir, &out_dir, &out_ext)?;

                if let Some(map) = output.map {
                    let map_path = out_path.with_extension(format!("{}.map", out_ext));
                    debug!("Writing map file: {:?}", &map_path.strip_prefix(&cwd)?);

                    output.code.push_str(&format!(
                        "\n//# sourceMappingURL={}",
                        &map_path.file_name().unwrap().to_string_lossy()
                    ));

                    write_file(map_path, map)?;
                }

                debug!("Writing file: {:?}", &out_path.strip_prefix(&cwd)?);
                write_file(out_path, &output.code)?;

                Ok(())
            })
        })
        .collect::<Vec<_>>();

    Ok(())
}

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

pub fn transform(code: String, options: &Options) -> Result<TransformOutput> {
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

                compiler.process_js_file(fm, handler, &options)
            })
        })
        .map_err(|e| e.to_pretty_error())
}

pub fn get_out_file_path<P1: AsRef<Path>, P2: AsRef<Path>, P3: AsRef<Path>>(
    path: P1,
    src_dir: P2,
    out_dir: P3,
    js_ext: &str,
) -> Result<std::path::PathBuf> {
    let path = path.as_ref();
    let src_dir = src_dir.as_ref();
    let out_dir = out_dir.as_ref();

    let out_ext = path
        .extension()
        .and_then(|ext| ext.to_str())
        .map(|ext| match ext {
            "ts" | "tsx" | "js" | "jsx" => js_ext,
            _ => ext,
        })
        .unwrap_or("js"); // 如果没有扩展名，默认使用 .js

    // src/utils/index.js -> dist
    let rel_path = path.strip_prefix(src_dir)?;
    let out_path = out_dir.join(rel_path.with_extension(out_ext));

    debug!("out_path: {:?}", out_path);

    Ok(out_path)
}

pub fn write_file<P: AsRef<Path>, C: AsRef<[u8]>>(path: P, content: C) -> Result<()> {
    let path = path.as_ref();

    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)?;
    }

    fs::write(path, content)?;

    Ok(())
}

use miette::{miette, LabeledSpan, SourceOffset};
pub fn serde_error_to_miette(e: serde_json::Error, content: &str, msg: &str) -> miette::Report {
    let offset = SourceOffset::from_location(content, e.line(), e.column());
    let span = LabeledSpan::at_offset(offset.offset(), e.to_string());
    miette!(labels = vec![span], "{msg}").with_source_code(content.to_owned())
}

#[cfg(test)]
mod tests {

    use super::*;

    #[test]
    fn test_transform_file() {
        let option_str = r#"{
            "sourceMaps": true,
            "minify": true,
        }"#;
        let options = serde_json::from_str::<Options>(option_str)
            .map_err(|e| serde_error_to_miette(e, option_str, "Could not parse swc options"))
            // .map_err(|e| e.to_string())
            .unwrap();

        let result = transform_file(Path::new("./transform-input.js"), &options);
        assert!(result.is_ok());
        if let Ok(output) = result {
            println!("{:?}", output);
        }
    }

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
