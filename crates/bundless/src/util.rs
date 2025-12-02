use anyhow::Result;
use miette::{LabeledSpan, SourceOffset, miette};
pub fn serde_error_to_miette(e: serde_json::Error, content: &str, msg: &str) -> miette::Report {
    let offset = SourceOffset::from_location(content, e.line(), e.column());
    let span = LabeledSpan::at_offset(offset.offset(), e.to_string());
    miette!(labels = vec![span], "{msg}").with_source_code(content.to_owned())
}

use std::fs;
use std::path::Path;
pub fn write_file<P: AsRef<Path>, C: AsRef<[u8]>>(path: P, content: C) -> Result<()> {
    let path = path.as_ref();

    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)?;
    }

    fs::write(path, content)?;

    Ok(())
}

/// Deep merge two JSON values, similar to the deepmerge library.
/// The overlay values will recursively override the base values.
/// - For objects: keys are merged recursively
/// - For arrays: concatenated together (deepmerge default behavior)
/// - For other types (primitives): the overlay value replaces the base value
pub fn merge_json_values(base: &mut serde_json::Value, overlay: &serde_json::Value) {
    match (base, overlay) {
        // Case 1: Both are objects - recursive merge
        (serde_json::Value::Object(base_map), serde_json::Value::Object(overlay_map)) => {
            for (key, value) in overlay_map {
                if let Some(base_value) = base_map.get_mut(key) {
                    merge_json_values(base_value, value);
                } else {
                    base_map.insert(key.clone(), value.clone());
                }
            }
        }
        // Case 2: Both are arrays - concatenate them
        (serde_json::Value::Array(base_arr), serde_json::Value::Array(overlay_arr)) => {
            base_arr.extend(overlay_arr.clone());
        }
        // Case 3: Other types - replace with overlay value
        (base_val, overlay_val) => {
            *base_val = overlay_val.clone();
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn test_merge_objects_deeply() {
        let mut base = json!({
            "foo": { "bar": 3 }
        });

        let overlay = json!({
            "foo": { "baz": 4 },
            "quux": 5
        });

        merge_json_values(&mut base, &overlay);

        assert_eq!(
            base,
            json!({
                "foo": { "bar": 3, "baz": 4 },
                "quux": 5
            })
        );
    }

    #[test]
    fn test_merge_arrays_concatenate() {
        let mut base = json!({
            "array": [1, 2, 3]
        });

        let overlay = json!({
            "array": [4, 5, 6]
        });

        merge_json_values(&mut base, &overlay);

        assert_eq!(
            base,
            json!({
                "array": [1, 2, 3, 4, 5, 6]
            })
        );
    }

    #[test]
    fn test_merge_primitives_replace() {
        let mut base = json!({
            "minify": true,
            "count": 42
        });

        let overlay = json!({
            "minify": false,
            "count": 100
        });

        merge_json_values(&mut base, &overlay);

        assert_eq!(
            base,
            json!({
                "minify": false,
                "count": 100
            })
        );
    }

    #[test]
    fn test_merge_complex_example() {
        // Example from discussion
        let mut base = json!({
            "foo": { "bar": 3 },
            "array": [{
                "does": "work",
                "too": [1, 2, 3]
            }]
        });

        let overlay = json!({
            "foo": { "baz": 4 },
            "quux": 5,
            "array": [{
                "does": "work",
                "too": [4, 5, 6]
            }, {
                "really": "yes"
            }]
        });

        merge_json_values(&mut base, &overlay);

        assert_eq!(
            base,
            json!({
                "foo": { "bar": 3, "baz": 4 },
                "quux": 5,
                "array": [
                    {
                        "does": "work",
                        "too": [1, 2, 3]
                    },
                    {
                        "does": "work",
                        "too": [4, 5, 6]
                    },
                    {
                        "really": "yes"
                    }
                ]
            })
        );
    }

    #[test]
    fn test_merge_nested_arrays() {
        let mut base = json!({
            "plugins": [
                { "name": "plugin-a", "options": { "enabled": true } }
            ]
        });

        let overlay = json!({
            "plugins": [
                { "name": "plugin-b", "options": { "enabled": false } }
            ]
        });

        merge_json_values(&mut base, &overlay);

        assert_eq!(
            base,
            json!({
                "plugins": [
                    { "name": "plugin-a", "options": { "enabled": true } },
                    { "name": "plugin-b", "options": { "enabled": false } }
                ]
            })
        );
    }

    #[test]
    fn test_merge_empty_objects() {
        let mut base = json!({});
        let overlay = json!({ "foo": "bar" });

        merge_json_values(&mut base, &overlay);

        assert_eq!(base, json!({ "foo": "bar" }));
    }

    #[test]
    fn test_merge_type_mismatch_replaces() {
        let mut base = json!({
            "value": [1, 2, 3]
        });

        let overlay = json!({
            "value": "string now"
        });

        merge_json_values(&mut base, &overlay);

        assert_eq!(
            base,
            json!({
                "value": "string now"
            })
        );
    }
}
