#[derive(Debug, PartialEq, Eq, Clone)]
pub enum ReactRuntime {
    Classic,
    Automatic,
}

#[derive(Debug, Clone)]
pub struct ReactConfig {
    pub runtime: ReactRuntime,
}
