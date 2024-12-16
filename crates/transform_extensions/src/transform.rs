use core::str;
use serde::Deserialize;
use std::collections::HashMap;
use swc_core::ecma::{
    ast::{self, Pass},
    transforms::testing::test_inline,
    visit::{noop_visit_mut_type, visit_mut_pass, VisitMut, VisitMutWith},
};

const JS_EXTS: [&str; 3] = [".js", ".mjs", ".cjs"];

#[derive(Clone, Debug, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct Config {
    /**
     * 自动给相对路径的导入添加扩展名
     * cjs 源码 -> 编译 esm 运行需要扩展名
     * ./foo, ./foo.js => ./foo.mjs 或 ./foo.cjs
     * 暂不考虑混写 cjs/mjs 场景
     */
    #[serde(default)]
    pub add_extension: bool,

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

    // without extension, append '.js' extension
    if config.add_extension && no_ext(src) {
        let name = src.value.as_str();
        let ext = config.extensions.get(".js").map_or(".js", |v| v);
        return Some(format!("{name}{ext}").into());
    }

    None
}

/**
 * 判断 src 无后缀
 */
fn no_ext(src: &ast::Str) -> bool {
    let has_js_ext = JS_EXTS.iter().any(|ext| src.value.ends_with(ext));
    !src.value[1..].contains('.') || !has_js_ext
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
                },
                "addExtension": true
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
                },
                "addExtension": true
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
                },
                "addExtension": true
            }"#
        )
        .unwrap()
    ),
    fn_cjs2esm,
    r#"
        import a from "./a.cjs";
        import b from "./b.js";
        import c from "./c";
    "#, // Input codes,
    r#"
        import a from "./a.mjs";
        import b from "./b.mjs";
        import c from "./c.mjs";
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
                },
                "addExtension": true
            }"#
        )
        .unwrap()
    ),
    fn_cjs2cjs,
    r#"
        import a from "./a.cjs";
        import b from "./b.js";
        import c from "./c";
    "#, // Input codes,
    r#"
        import a from "./a.js";
        import b from "./b.js";
        import c from "./c.js";
    "# // Output codes after transformed with plugin
);
