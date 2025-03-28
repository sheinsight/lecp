use serde::Deserialize;
use swc_core::ecma::{
    ast::{self, Pass},
    visit::{noop_visit_mut_type, visit_mut_pass, VisitMut, VisitMutWith},
};

#[derive(Clone, Debug, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct Config {
    #[serde(default)]
    pub preserve_import_extension: bool,
}

const TS_EXTENSIONS: [(&str, &str); 4] =
    [(".ts", ".js"), (".tsx", ".js"), (".mts", ".mjs"), (".cts", ".cjs")];

fn replace_ts_extension(src: &ast::Str, config: &Config) -> Option<ast::Str> {
    if !src.value.starts_with('.') {
        return None;
    }

    let path = &src.value;
    TS_EXTENSIONS.iter().find_map(|(ts_ext, js_ext)| {
        if path.ends_with(ts_ext) && !path.ends_with(&format!(".d{}", ts_ext)) {
            let ext = if config.preserve_import_extension { js_ext } else { ".js" };

            path.strip_suffix(ts_ext).map(|file| format!("{}{}", file, ext).into())
        } else {
            None
        }
    })
}

struct RewriteImportExtensions {
    config: Config,
}

impl VisitMut for RewriteImportExtensions {
    noop_visit_mut_type!();

    // import './foo.ts'
    fn visit_mut_import_decl(&mut self, n: &mut ast::ImportDecl) {
        n.visit_mut_children_with(self);

        if let Some(replaced) = replace_ts_extension(&n.src, &self.config) {
            n.src = Box::new(replaced);
        }
    }

    // export * from './foo.ts'
    fn visit_mut_export_all(&mut self, n: &mut ast::ExportAll) {
        n.visit_mut_children_with(self);

        if let Some(replaced) = replace_ts_extension(&n.src, &self.config) {
            n.src = Box::new(replaced);
        }
    }

    // export { foo } from './foo.ts'
    fn visit_mut_named_export(&mut self, n: &mut ast::NamedExport) {
        n.visit_mut_children_with(self);

        if let Some(src) = &n.src {
            if let Some(replaced) = replace_ts_extension(src, &self.config) {
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
                    if let Some(replaced) = replace_ts_extension(src, &self.config) {
                        value.expr = Box::new(ast::Expr::Lit(ast::Lit::Str(replaced)));
                    }
                }
            }
        }
    }
}

pub fn init(config: Config) -> impl Pass {
    visit_mut_pass(RewriteImportExtensions { config })
}

#[cfg(test)]
mod tests {

    use super::*;
    use swc_core::ecma::transforms::testing::test_inline;

    test_inline!(
        Default::default(),
        |_| init(serde_json::from_str(r#"{}"#).unwrap()),
        fn_ts,
        r#"
            import a from "./foo.ts";
            import { b } from "./foo.ts";
            export * from "./foo.ts"
            export { foo } from "./foo.ts"
            import("./foo.ts")
        "#, // Input codes,
        r#"
            import a from "./foo.js";
            import { b } from "./foo.js";
            export * from "./foo.js"
            export { foo } from "./foo.js"
            import("./foo.js")
        "# // Output codes after transformed with plugin
    );

    test_inline!(
        Default::default(),
        |_| init(serde_json::from_str(r#"{}"#).unwrap()),
        fn_tsx,
        r#"
            import a from "./foo.tsx";
            import { b } from "./foo.tsx";
            export * from "./foo.tsx"
            export { foo } from "./foo.tsx"
            import("./foo.tsx")
        "#, // Input codes,
        r#"
            import a from "./foo.js";
            import { b } from "./foo.js";
            export * from "./foo.js"
            export { foo } from "./foo.js"
            import("./foo.js")
        "# // Output codes after transformed with plugin
    );

    test_inline!(
        Default::default(),
        |_| init(serde_json::from_str(r#"{}"#).unwrap()),
        fn_js,
        r#"
            import a from "./foo.js";
            import { b } from "./foo.js";
            export * from "./foo.js"
            export { foo } from "./foo.js"
            import("./foo.js")
        "#, // Input codes,
        r#"
            import a from "./foo.js";
            import { b } from "./foo.js";
            export * from "./foo.js"
            export { foo } from "./foo.js"
            import("./foo.js")
        "# // Output codes after transformed with plugin
    );

    test_inline!(
        Default::default(),
        |_| init(serde_json::from_str(r#"{}"#).unwrap()),
        fn_mts,
        r#"
            import a from "./foo.mts";
            import { b } from "./foo.mts";
            export * from "./foo.mts"
            export { foo } from "./foo.mts"
            import("./foo.mts")
        "#, // Input codes,
        r#"
            import a from "./foo.js";
            import { b } from "./foo.js";
            export * from "./foo.js"
            export { foo } from "./foo.js"
            import("./foo.js")
        "# // Output codes after transformed with plugin
    );

    test_inline!(
        Default::default(),
        |_| init(serde_json::from_str(r#"{"preserveImportExtension":true}"#).unwrap()),
        fn_mts_preserve,
        r#"
            import a from "./foo.mts";
            import { b } from "./foo.mts";
            export * from "./foo.mts"
            export { foo } from "./foo.mts"
            import("./foo.mts")
        "#, // Input codes,
        r#"
            import a from "./foo.mjs";
            import { b } from "./foo.mjs";
            export * from "./foo.mjs"
            export { foo } from "./foo.mjs"
            import("./foo.mjs")
        "# // Output codes after transformed with plugin
    );

    test_inline!(
        Default::default(),
        |_| init(serde_json::from_str(r#"{}"#).unwrap()),
        fn_cts,
        r#"
            import a from "./foo.cts";
            import { b } from "./foo.cts";
            export * from "./foo.cts"
            export { foo } from "./foo.cts"
            import("./foo.cts")
        "#, // Input codes,
        r#"
            import a from "./foo.js";
            import { b } from "./foo.js";
            export * from "./foo.js"
            export { foo } from "./foo.js"
            import("./foo.js")
        "# // Output codes after transformed with plugin
    );

    test_inline!(
        Default::default(),
        |_| init(serde_json::from_str(r#"{"preserveImportExtension":true}"#).unwrap()),
        fn_cts_preserve,
        r#"
            import a from "./foo.cts";
            import { b } from "./foo.cts";
            export * from "./foo.cts"
            export { foo } from "./foo.cts"
            import("./foo.cts")
        "#, // Input codes,
        r#"
            import a from "./foo.cjs";
            import { b } from "./foo.cjs";
            export * from "./foo.cjs"
            export { foo } from "./foo.cjs"
            import("./foo.cjs")
        "# // Output codes after transformed with plugin
    );
}
