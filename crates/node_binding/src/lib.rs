use napi::bindgen_prelude::*;
use napi_derive::napi;

use lecp_bundless::{
    BundlessOptions, bundless_dts_file, bundless_file, bundless_files, transform_dts_file,
};

pub struct BundlessJsTask {
    options: Buffer,
}

#[napi]
impl Task for BundlessJsTask {
    type Output = ();
    type JsValue = ();

    fn compute(&mut self) -> Result<Self::Output> {
        let options = match serde_json::from_slice::<BundlessOptions>(self.options.as_ref()) {
            Ok(opts) => opts,
            Err(e) => return Err(Error::from_reason(format!("parse option error: {e}"))),
        };

        bundless_files(&options).map_err(|e| Error::from_reason(format!("build failed: {e}")))
    }

    fn resolve(&mut self, _: Env, _output: Self::Output) -> Result<Self::JsValue> {
        Ok(())
    }
}

#[napi]
pub fn bundless_files_async(options: Buffer) -> AsyncTask<BundlessJsTask> {
    AsyncTask::new(BundlessJsTask { options })
}

#[napi]
pub async fn bundless_file_async(file: String, options: Buffer) -> Result<()> {
    let options = match serde_json::from_slice::<BundlessOptions>(options.as_ref()) {
        Ok(opts) => opts,
        Err(e) => return Err(Error::from_reason(format!("parse option error: {e}"))),
    };

    bundless_file(&file, &options).map_err(|e| Error::from_reason(format!("build failed: {e}")))
}

#[napi]
pub async fn bundless_dts_async(file: String, options: Buffer) -> Result<()> {
    let options = match serde_json::from_slice::<BundlessOptions>(options.as_ref()) {
        Ok(opts) => opts,
        Err(e) => return Err(Error::from_reason(format!("parse option error: {e}"))),
    };

    bundless_dts_file(&file, &options).map_err(|e| Error::from_reason(format!("build failed: {e}")))
}

#[napi]
pub async fn transform_dts_async(file: String, options: Buffer) -> Result<String> {
    let options = match serde_json::from_slice::<BundlessOptions>(options.as_ref()) {
        Ok(opts) => opts,
        Err(e) => return Err(Error::from_reason(format!("parse option error: {e}"))),
    };

    transform_dts_file(&file, &options)
        .map_err(|e| Error::from_reason(format!("build failed: {e}")))
}
