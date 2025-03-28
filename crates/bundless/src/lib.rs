use anyhow::{Context, Result};
use std::{path::Path, sync::Arc};
use swc_core::{
    base::{config::Options, try_with_handler, Compiler, TransformOutput},
    common::{FileName, SourceMap, GLOBALS},
};

pub fn transform_file(file: &Path, options: &Options) -> Result<TransformOutput> {
    let cm = Arc::<SourceMap>::default(); // cm -> code map
    let compiler = Compiler::new(cm.clone());

    // 计算 SyntaxContext
    GLOBALS.set(&Default::default(), || {
        try_with_handler(cm.clone(), Default::default(), |handler| {
            println!("load file {:?}", file);

            let file = cm.load_file(file).context("failed to load file")?;
            compiler.process_js_file(file, handler, options).context("failed to process file")
        })
    })
}

// !options.config.error.filename -> skip_filename:true
// handler config
// swc_core::base::HandlerOpts {
//     skip_filename,
//     ..Default::default()
// },

pub fn transform(code: String, options: &Options) -> Result<TransformOutput> {
    let cm = Arc::<SourceMap>::default(); // cm -> code map
    let compiler = Compiler::new(cm.clone());

    // 计算 SyntaxContext
    GLOBALS.set(&Default::default(), || {
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
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_transform_file() {
        let result = transform_file(Path::new("./transform-input.js"), &Default::default());
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
}
