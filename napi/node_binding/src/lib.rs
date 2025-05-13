use napi::bindgen_prelude::*;
use napi_derive::napi;
use tokio::fs;

#[napi]
pub fn sum(a: i32, b: i32) -> i32 {
    a + b
}

#[napi]
pub async fn sum_async(a: i32, b: i32) -> Result<i32> {
    Ok(a + b)
}

#[napi]
pub async fn read_file_async(path: String) -> Result<Buffer> {
    fs::read(&path).await.map(|content| content.into()).map_err(|e| {
        Error::new(Status::GenericFailure, format!("failed to read file '{}', {}", path, e))
    })
}

pub struct AsyncTaskReadFile {
    path: String,
}

#[napi]
impl Task for AsyncTaskReadFile {
    type Output = Vec<u8>;
    type JsValue = Buffer;

    fn compute(&mut self) -> Result<Self::Output> {
        std::fs::read(&self.path).map_err(|e| Error::new(Status::GenericFailure, format!("{}", e)))
    }

    fn resolve(&mut self, _: Env, output: Self::Output) -> Result<Self::JsValue> {
        Ok(output.into())
    }
}

#[napi]
pub fn async_task_read_file(path: String) -> AsyncTask<AsyncTaskReadFile> {
    AsyncTask::new(AsyncTaskReadFile { path })
}

// AsyncTask 将同步 api 放到异步中
