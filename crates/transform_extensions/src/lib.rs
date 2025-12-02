use core::str;
use std::collections::HashMap;
use std::path::Path;

use path_absolutize::*;
use serde::Deserialize;
use swc_core::ecma::ast::{self, Pass};
use swc_core::ecma::visit::{VisitMut, VisitMutWith, noop_visit_mut_type, visit_mut_pass};

#[derive(Clone, Debug, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct Config {
    /**
     * {
     *  ".js": ".mjs",
     *  ".cjs": ".mjs",
     *  ".mjs": ".cjs",
     * }
     */
    #[serde(default)]
    pub extensions: HashMap<String, String>,

    /// Source directory path (absolute)
    #[serde(default)]
    pub source_dir: Option<String>,

    /// Current file directory (absolute)
    #[serde(default)]
    pub current_dir: Option<String>,
}

fn replace_extension(src: &ast::Str, config: &Config) -> Option<ast::Str> {
    let path = &src.value.to_atom_lossy().to_string();

    // Only handle relative paths starting with ./ or ../
    if !path.starts_with("./") && !path.starts_with("../") {
        return None;
    }

    // Check if the resolved path is within source_dir
    if let (Some(source_dir), Some(current_dir)) = (&config.source_dir, &config.current_dir) {
        let import_path = Path::new(current_dir).join(path);
        let absolute_path = import_path.absolutize().ok()?;

        if !absolute_path.starts_with(source_dir) {
            return None;
        }
    }

    // Find and replace extension
    config.extensions.iter().find(|(key, _)| path.ends_with(key.as_str())).and_then(|(key, ext)| {
        path.strip_suffix(key.as_str()).map(|name| format!("{name}{ext}").into())
    })
}

struct RewriteImportingExtensions {
    config: Config,
}

impl VisitMut for RewriteImportingExtensions {
    noop_visit_mut_type!();

    // import './foo.ts'
    fn visit_mut_import_decl(&mut self, n: &mut ast::ImportDecl) {
        n.visit_mut_children_with(self);

        if let Some(replaced) = replace_extension(&n.src, &self.config) {
            n.src = Box::new(replaced);
        }
    }

    // export * from './foo.ts'
    fn visit_mut_export_all(&mut self, n: &mut ast::ExportAll) {
        n.visit_mut_children_with(self);

        if let Some(replaced) = replace_extension(&n.src, &self.config) {
            n.src = Box::new(replaced);
        }
    }

    // export { foo } from './foo.ts'
    fn visit_mut_named_export(&mut self, n: &mut ast::NamedExport) {
        n.visit_mut_children_with(self);

        if let Some(src) = &n.src {
            if let Some(replaced) = replace_extension(src, &self.config) {
                n.src = Some(Box::new(replaced));
            }
        }
    }

    // import('./foo.ts')
    fn visit_mut_call_expr(&mut self, n: &mut ast::CallExpr) {
        n.visit_mut_children_with(self);

        if n.callee.is_import() && !n.args.is_empty() {
            if let Some(value) = n.args.first_mut() {
                if let ast::Expr::Lit(ast::Lit::Str(src)) = value.expr.as_ref() {
                    if let Some(replaced) = replace_extension(src, &self.config) {
                        value.expr = Box::new(ast::Expr::Lit(ast::Lit::Str(replaced)));
                    }
                }
            }
        }
    }
}

pub fn transform(config: Config) -> impl Pass {
    visit_mut_pass(RewriteImportingExtensions { config })
}

#[cfg(test)]
mod tests {
    use swc_core::ecma::transforms::testing::test_inline;

    use super::*;

    test_inline!(
        Default::default(),
        |_| transform(
            serde_json::from_str(
                r#"
            {
                "extensions": {
                    ".js": ".cjs",
                    ".mjs": ".cjs"
                }
            }"#
            )
            .unwrap()
        ),
        fn_esm2cjs,
        r#"
        import a from "./a.js";
        import b from "./b.mjs";
        const c = import("./c.js");
        const d = import("./d.mjs");

    "#, // Input codes,
        r#"
        import a from "./a.cjs";
        import b from "./b.cjs";
        const c = import("./c.cjs");
        const d = import("./d.cjs");
    "# // Output codes after transformed with plugin
    );

    test_inline!(
        Default::default(),
        |_| transform(
            serde_json::from_str(
                r#"
            {
                "extensions": {
                    ".js": ".cjs",
                    ".mjs": ".cjs"
                },
                "sourceDir": "/project/src",
                "currentDir": "/project/src"
            }"#
            )
            .unwrap()
        ),
        fn_esm2cjs_only_src,
        r#"
        import a from "../compiled/xxx/a.js";
        import b from "../compiled/xxx/b.mjs";
        const c = import("../compiled/xxx/c.js");
        const d = import("../compiled/xxx/d.mjs");

    "#, // Input codes,
        r#"
        import a from "../compiled/xxx/a.js";
        import b from "../compiled/xxx/b.mjs";
        const c = import("../compiled/xxx/c.js");
        const d = import("../compiled/xxx/d.mjs");
    "# // Output codes after transformed with plugin
    );

    test_inline!(
        Default::default(),
        |_| transform(
            serde_json::from_str(
                r#"
            {
                "extensions": {
                    ".js": ".js",
                    ".mjs": ".js"
                }
            }"#
            )
            .unwrap()
        ),
        fn_esm2esm,
        r#"
        import a from "./a.js";
        import b from "./b.mjs";
        const c = import("./c.js");
        const d = import("./d.mjs");
    "#, // Input codes,
        r#"
        import a from "./a.js";
        import b from "./b.js";
        const c = import("./c.js");
        const d = import("./d.js");
    "# // Output codes after transformed with plugin
    );

    test_inline!(
        Default::default(),
        |_| transform(
            serde_json::from_str(
                r#"
            {
                "extensions": {
                    ".cjs": ".mjs",
                    ".js": ".mjs"
                }
            }"#
            )
            .unwrap()
        ),
        fn_cjs2esm,
        r#"
        import a from "./a.cjs";
        import b from "./b.js";
        const c = import("./c.cjs");
        const d = import("./d.js");
    "#, // Input codes,
        r#"
        import a from "./a.mjs";
        import b from "./b.mjs";
        const c = import("./c.mjs");
        const d = import("./d.mjs");
    "# // Output codes after transformed with plugin
    );

    test_inline!(
        Default::default(),
        |_| transform(
            serde_json::from_str(
                r#"
            {
                "extensions": {
                    ".cjs": ".js",
                    ".js": ".js"
                }
            }"#
            )
            .unwrap()
        ),
        fn_cjs2cjs,
        r#"
        import a from "./a.cjs";
        import b from "./b.js";
        const c = import("./c.cjs");
        const d = import("./d.js");
        // import c from "./c";
    "#, // Input codes,
        r#"
        import a from "./a.js";
        import b from "./b.js";
        const c = import("./c.js");
        const d = import("./d.js");
        // import c from "./c.js";
    "# // Output codes after transformed with plugin
    );
}
