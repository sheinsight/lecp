use napi::bindgen_prelude::*;
use napi_derive::napi;

use lecp_bundless::{BundlessOptions, bundless_file, bundless_files};

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
            Err(e) => return Err(Error::from_reason(format!("解析选项失败: {}", e))),
        };

        bundless_files(&options).map_err(|e| Error::from_reason(format!("构建失败: {}", e)))
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
        Err(e) => return Err(Error::from_reason(format!("解析选项失败: {}", e))),
    };

    bundless_file(&file, &options).map_err(|e| Error::from_reason(format!("构建失败: {}", e)))
}
