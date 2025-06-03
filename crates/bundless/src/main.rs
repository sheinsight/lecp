use anyhow::Result;
use lecp_bundless::{
    BundlessOptions, CSS, Define, JsxRuntime, React, Shims, bundless_js, serde_error_to_miette,
};
use serde_json::json;

fn main() -> Result<()> {
    miette::set_hook(Box::new(|_| {
        Box::new(
            miette::MietteHandlerOpts::new().color(true).unicode(true).terminal_links(true).build(),
        )
    }))?;

    env_logger::init();

    let start_time = std::time::Instant::now();
    let cwd = std::env::current_dir()?.join("./examples/demo-sdk").canonicalize()?;
    let cwd = std::env::current_dir()?.join("./examples/demo-component").canonicalize()?;

    // way1: rust struct
    // let options = BundlessOptions::default()
    //     .cwd(&cwd)
    //     .targets(json!({
    //         "chrome": "55"
    //     }))
    //     .define(Define {
    //         variables: [
    //             ("PRODUCTION".to_string(), "\"true\"".to_string()),
    //             ("VERSION".to_string(), "\"5fa3b9\"".to_string()),
    //             ("BROWSER_SUPPORTS_HTML5".to_string(), "\"true\"".to_string()),
    //             ("typeof window".to_string(), "\"object\"".to_string()),
    //             ("process.env.NODE_ENV".to_string(), "\"production\"".to_string()),
    //         ]
    //         .into(),
    //     })
    //     .shims(Shims::Object { legacy: Some(true) })
    //     .source_map(true)
    //     .minify(true)
    //     .react(React { jsx_runtime: Some(JsxRuntime::Automatic) })
    //     .css(CSS::default().css_modules("[name]_[local]_[hash:base64:5]").less_compile(true));

    // way2: json
    let options_json = json!({
        "isModule": true,
        "format": "esm",
        "cwd": &cwd,
        "targets": {
            "chrome": "55"
            // "node": "20.11.0",
        },
        "define": {
            "PRODUCTION": "\"true\"",
            "VERSION": "\"5fa3b9\"",
            "BROWSER_SUPPORTS_HTML5": "\"true\"",
            "typeof window": "\"object\"",
            "process.env.NODE_ENV": "\"production\""
        },
        // "shims": {
        //     "legacy": true
        // },
        // "sourcemap": true,
        // "minify": false,
        "react": {
            "jsxRuntime": "automatic"
        },
        "css": {
            "cssModules": "demo-component__[name]_[local]",
            "lessCompile": true
        },
        "alias": {
            "@": "./src",
        },
        "exclude": [],
    });

    let options_str = options_json.to_string();
    let options = serde_json::from_str::<BundlessOptions>(&options_str).map_err(|e| {
        let miette_err = serde_error_to_miette(e, &options_str, "Could not parse lecp config");
        anyhow::anyhow!("{:?}", miette_err)
    })?;

    let res = bundless_js(&cwd, &options);
    if let Err(e) = res {
        eprintln!("\n{:?}", e);
        std::process::exit(1);
    }

    let end_time = std::time::Instant::now();
    println!("Transforming files took: {} ms", (end_time - start_time).as_millis());

    Ok(())
}
