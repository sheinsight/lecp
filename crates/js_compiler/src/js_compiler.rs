use std::path::Path;

use anyhow::Result;

pub struct JsCompiler<P: AsRef<Path>> {
    source_code: String,
    file_path: P,
}

impl<P: AsRef<Path>> JsCompiler<P> {
    pub fn new(file_path: P) -> anyhow::Result<Self> {
        let source_code = std::fs::read_to_string(&file_path)?;
        Ok(Self {
            source_code,
            file_path,
        })
    }
}

impl<P: AsRef<Path>> JsCompiler<P> {
    pub fn pre_compile(&self) -> Result<()> {
        Ok(())
    }

    pub fn compile(&self) -> Result<()> {
        Ok(())
    }

    pub fn post_compile(&self) -> Result<()> {
        Ok(())
    }

    pub fn run(&self) -> Result<()> {
        self.pre_compile()?;
        self.compile()?;
        self.post_compile()?;
        Ok(())
    }
}
