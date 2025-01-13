use core::str;
use serde::Deserialize;
use std::collections::HashMap;
use swc_core::ecma::{
    ast::{self, Pass},
    transforms::testing::test_inline,
    visit::{noop_visit_mut_type, visit_mut_pass, VisitMut, VisitMutWith},
};

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
}

fn replace_extension(src: &ast::Str, config: &Config) -> Option<ast::Str> {
    // Only handle relative path
    if !src.value.starts_with('.') {
        return None;
    }

    // with extension
    let ext = config
        .extensions
        .iter()
        .find(|(key, _)| src.value.ends_with(*key));

    if let Some((key, ext)) = ext {
        if let Some(name) = src.value.strip_suffix(key) {
            return Some(format!("{name}{ext}").into());
        }
    }

    None
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

pub fn init(config: Config) -> impl Pass {
    visit_mut_pass(RewriteImportingExtensions { config })
}

test_inline!(
    Default::default(),
    |_| init(
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
    "#, // Input codes,
    r#"
        import a from "./a.cjs";
        import b from "./b.cjs";
    "# // Output codes after transformed with plugin
);

test_inline!(
    Default::default(),
    |_| init(
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
    "#, // Input codes,
    r#"
        import a from "./a.js";
        import b from "./b.js";
    "# // Output codes after transformed with plugin
);

test_inline!(
    Default::default(),
    |_| init(
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
    "#, // Input codes,
    r#"
        import a from "./a.mjs";
        import b from "./b.mjs";
    "# // Output codes after transformed with plugin
);

test_inline!(
    Default::default(),
    |_| init(
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
        // import c from "./c";
    "#, // Input codes,
    r#"
        import a from "./a.js";
        import b from "./b.js";
        // import c from "./c.js";
    "# // Output codes after transformed with plugin
);
