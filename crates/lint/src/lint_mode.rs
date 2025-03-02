#[derive(Debug, PartialEq, Eq)]
pub enum LintMode {
    Development,
    Production,
    None,
}
