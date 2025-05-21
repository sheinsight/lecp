use lecp_bundless::{BundlessOptions, bundless_js};
use napi::bindgen_prelude::*;
use napi_derive::napi;

pub struct BundlessJsTask {
    cwd: String,
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

        bundless_js(&self.cwd, &options).map_err(|e| Error::from_reason(format!("构建失败: {}", e)))
    }

    fn resolve(&mut self, _: Env, _output: Self::Output) -> Result<Self::JsValue> {
        Ok(())
    }
}

#[napi]
pub fn bundless_js_async(cwd: String, options: Buffer) -> AsyncTask<BundlessJsTask> {
    AsyncTask::new(BundlessJsTask { cwd, options })
}
