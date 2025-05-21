use miette::{LabeledSpan, SourceOffset, miette};
pub fn serde_error_to_miette(e: serde_json::Error, content: &str, msg: &str) -> miette::Report {
    let offset = SourceOffset::from_location(content, e.line(), e.column());
    let span = LabeledSpan::at_offset(offset.offset(), e.to_string());
    miette!(labels = vec![span], "{msg}").with_source_code(content.to_owned())
}
