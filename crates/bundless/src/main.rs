use anyhow::{Ok, Result};
use log::debug;
use rayon::prelude::*;
use serde_json::json;
use swc_core::base::config::Options;
use wax::Glob;

use lecp_bundless::{get_out_file_path, serde_error_to_miette, transform_file, write_file};

fn main() -> Result<()> {
    env_logger::init();

    let start_time = std::time::Instant::now();

    let cwd = std::env::current_dir()?;
    println!("Bundless CLI: {:?}", std::env::current_dir()?);

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
        .unwrap();

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

    let end_time = std::time::Instant::now();
    println!("Transforming files took: {} ms", (end_time - start_time).as_millis());

    Ok(())
}

// webpack define 格式转换成 swc `jsc.transform.optimizer.globals` 配置
// fn get_globals_form_define(define: HashMap<String, String>) {
//     // typeof -> globals.typeofs
//     // vars -> globals.vars
// }
