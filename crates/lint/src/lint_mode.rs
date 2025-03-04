#[derive(Debug, PartialEq, Eq, Clone, Copy)]
pub enum LintMode {
    Development,
    Production,
    None,
}
