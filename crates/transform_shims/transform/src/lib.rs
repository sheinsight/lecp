use std::collections::HashMap;

use serde::Deserialize;
use swc_core::common::util::take::Take;
use swc_core::common::{DUMMY_SP, Mark, SyntaxContext};
use swc_core::ecma::ast::{
    CallExpr, Callee, Decl, Expr, ExprOrSpread, Id, Ident, ImportDecl, ImportNamedSpecifier,
    ImportSpecifier, KeyValuePatProp, MemberExpr, MemberProp, MetaPropExpr, MetaPropKind,
    ModuleDecl, ModuleExportName, ModuleItem, ObjectPat, ObjectPatProp, Pass, Pat, PropName, Stmt,
    VarDecl, VarDeclKind, VarDeclarator,
};
use swc_core::ecma::transforms::base::resolver;
use swc_core::ecma::utils::{private_ident, quote_str};
use swc_core::ecma::visit::{VisitMut, VisitMutWith, noop_visit_mut_type, visit_mut_pass};

#[derive(Clone, Debug, Deserialize, Default, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum Target {
    #[default]
    UNKNOWN,

    ESM,
    CJS,
}

#[derive(Clone, Debug, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct Config {
    #[serde(default)]
    pub legacy: bool,

    pub target: Target,
}

struct TransformShims {
    config: Config,
    id_map: HashMap<Id, String>,
    has_legacy_transform: bool,
    has_require_transform: bool,
    require_ident: Option<Ident>,
    create_require_ident: Option<Ident>,
    unresolved_ctxt: SyntaxContext,
}

const CJS_DIRNAME: &str = "__dirname";
const CJS_FILENAME: &str = "__filename";
const CJS_URL: &str = "require(\"url\").pathToFileURL(__filename).toString()";

const ESM_DIRNAME: &str = "import.meta.dirname";
const ESM_FILENAME: &str = "import.meta.filename";
const ESM_DIRNAME_LEGACY: &str = "fileURLToPath(new URL('.', import.meta.url))";
const ESM_FILENAME_LEGACY: &str = "fileURLToPath(import.meta.url)";

/// Check if the module items contain a specific import specifier from a module
fn has_import_specifier(items: &[ModuleItem], module: &str, specifier: &str) -> bool {
    items.iter().any(|item| {
        matches!(item,
            ModuleItem::ModuleDecl(ModuleDecl::Import(decl))
            if decl.src.value == module
            && decl.specifiers.iter().any(|spec| {
                matches!(spec, ImportSpecifier::Named(ImportNamedSpecifier { local, .. })
                    if local.sym.as_ref() == specifier)
            })
        )
    })
}

/// Create an import declaration with a named specifier
fn create_import_decl(local: Ident, imported: Option<Ident>, module: &str) -> ImportDecl {
    ImportDecl {
        span: DUMMY_SP,
        specifiers: vec![ImportSpecifier::Named(ImportNamedSpecifier {
            span: DUMMY_SP,
            local,
            imported: imported.map(ModuleExportName::Ident),
            is_type_only: false,
        })],
        src: Box::new(quote_str!(module)),
        type_only: false,
        with: None,
        phase: Default::default(),
    }
}

/// Create a require variable declaration: const __require = _createRequire(import.meta.url)
fn create_require_var_decl(require_ident: Ident, create_require_ident: Ident) -> VarDecl {
    VarDecl {
        span: DUMMY_SP,
        kind: VarDeclKind::Const,
        declare: false,
        decls: vec![VarDeclarator {
            span: DUMMY_SP,
            name: Pat::Ident(require_ident.into()),
            init: Some(Box::new(Expr::Call(CallExpr {
                span: DUMMY_SP,
                callee: Callee::Expr(Box::new(Expr::Ident(create_require_ident))),
                args: vec![ExprOrSpread {
                    spread: None,
                    expr: Box::new(Expr::Member(MemberExpr {
                        span: DUMMY_SP,
                        obj: Box::new(Expr::MetaProp(MetaPropExpr {
                            span: DUMMY_SP,
                            kind: MetaPropKind::ImportMeta,
                        })),
                        prop: MemberProp::Ident(private_ident!("url").into()),
                    })),
                }],
                type_args: None,
                ctxt: Default::default(),
            }))),
            definite: false,
        }],
        ctxt: Default::default(),
    }
}

impl VisitMut for TransformShims {
    noop_visit_mut_type!();

    // esm support __dirname, __filename, require
    fn visit_mut_ident(&mut self, i: &mut Ident) {
        match self.config.target {
            Target::ESM => {
                // ESM: require -> __require (using the shared identifier)
                if i.sym.as_ref() == "require" {
                    let require_ident =
                        self.require_ident.get_or_insert_with(|| private_ident!("__require"));
                    *i = require_ident.clone();
                    self.has_require_transform = true;
                    return;
                }

                // Transform __dirname and __filename for ESM
                // Check if the identifier is in the unresolved scope (not shadowed)
                if i.ctxt != self.unresolved_ctxt {
                    return;
                }

                let sym = match (i.sym.as_ref(), self.config.legacy) {
                    ("__dirname", true) => {
                        self.has_legacy_transform = true;
                        ESM_DIRNAME_LEGACY
                    }
                    ("__dirname", false) => ESM_DIRNAME,
                    ("__filename", true) => {
                        self.has_legacy_transform = true;
                        ESM_FILENAME_LEGACY
                    }
                    ("__filename", false) => ESM_FILENAME,
                    _ => return,
                };
                i.sym = sym.into();
            }
            Target::CJS => {
                // Transform destructured variables from import.meta
                // e.g., const { dirname, filename } = import.meta
                if let Some(value) = self.id_map.get(&i.to_id()) {
                    let sym = match value.as_str() {
                        "dirname" => CJS_DIRNAME,
                        "filename" => CJS_FILENAME,
                        "url" => CJS_URL,
                        _ => return,
                    };
                    i.sym = sym.into();
                }
            }
            Target::UNKNOWN => {}
        }
    }

    // cjs support import.meta.dirname, import.meta.filename
    fn visit_mut_expr(&mut self, e: &mut Expr) {
        e.visit_mut_children_with(self);

        if self.config.target == Target::CJS {
            if let Expr::Member(n) = e {
                if let (Expr::MetaProp(MetaPropExpr { kind, .. }), MemberProp::Ident(prop)) =
                    (&*n.obj, &n.prop)
                {
                    if *kind == MetaPropKind::ImportMeta {
                        let sym = match prop.sym.as_ref() {
                            "dirname" => CJS_DIRNAME,
                            "filename" => CJS_FILENAME,
                            _ => return,
                        };
                        *e = private_ident!(sym).into();
                    }
                }
            }
        }
    }

    // CJS support: Transform destructured import.meta variables
    // e.g., const { dirname, filename } = import.meta
    // Maps the destructured identifiers to their import.meta property names
    fn visit_mut_var_declarator(&mut self, v: &mut VarDeclarator) {
        v.visit_mut_children_with(self);

        // Only process for CJS target
        if self.config.target == Target::CJS {
            // Check if this is destructuring from import.meta
            if let Some(Expr::MetaProp(MetaPropExpr { kind: MetaPropKind::ImportMeta, .. })) =
                v.init.as_deref()
            {
                // Extract the destructured property names and map them
                if let Pat::Object(ObjectPat { props, .. }) = &v.name {
                    props.iter().for_each(|prop| match prop {
                        ObjectPatProp::KeyValue(KeyValuePatProp { key, value, .. }) => {
                            if let (Pat::Ident(ident), PropName::Ident(name)) = (&**value, &key) {
                                self.id_map.insert(ident.to_id(), name.sym.to_string());
                            }
                        }
                        ObjectPatProp::Assign(assign) => {
                            self.id_map.insert(assign.key.to_id(), assign.key.sym.to_string());
                        }
                        _ => (),
                    });
                }

                // Mark the declarator for removal
                v.name.take();
            }
        }
    }

    // remove var decl ↓↓↓
    // const { dirname, filename } = import.meta; -> const ;
    fn visit_mut_var_declarators(&mut self, vars: &mut Vec<VarDeclarator>) {
        vars.visit_mut_children_with(self);

        // Remove declarators with invalid names (those marked for removal)
        vars.retain(|node| !node.name.is_invalid());
    }

    // const ; -> ;
    fn visit_mut_stmt(&mut self, stmt: &mut Stmt) {
        stmt.visit_mut_children_with(self);

        if let Stmt::Decl(Decl::Var(var)) = stmt {
            if var.decls.is_empty() {
                stmt.take();
            }
        }
    }

    // remove ;
    fn visit_mut_stmts(&mut self, stmts: &mut Vec<Stmt>) {
        stmts.visit_mut_children_with(self);

        // We remove `Stmt::Empty` from the statement list.
        // This is optional, but it's required if you don't want extra `;` in output.
        stmts.retain(|s| !matches!(s, Stmt::Empty(..)));
    }

    fn visit_mut_module_items(&mut self, items: &mut Vec<ModuleItem>) {
        items.visit_mut_children_with(self);

        // Add import { fileURLToPath } from "node:url" for legacy ESM
        if self.config.target == Target::ESM && self.config.legacy && self.has_legacy_transform {
            // Only check if import exists when we need to add it
            if !has_import_specifier(items, "node:url", "fileURLToPath") {
                let import_decl =
                    create_import_decl(private_ident!("fileURLToPath"), None, "node:url");
                items.insert(0, ModuleItem::ModuleDecl(ModuleDecl::Import(import_decl)));
            }
        }

        // Add import { createRequire } from "node:module" and const __require = createRequire(import.meta.url)
        if self.config.target == Target::ESM && self.has_require_transform {
            // Only check if import exists when we need to add it
            if !has_import_specifier(items, "node:module", "createRequire") {
                // Create or reuse the shared identifier for createRequire
                let create_require_ident = self
                    .create_require_ident
                    .get_or_insert_with(|| private_ident!("_createRequire"))
                    .clone();

                // Use the same __require identifier that was created during visit_mut_ident
                let require_ident = self
                    .require_ident
                    .as_ref()
                    .cloned()
                    .unwrap_or_else(|| private_ident!("__require"));

                // const __require = _createRequire(import.meta.url);
                let require_var_decl =
                    create_require_var_decl(require_ident, create_require_ident.clone());

                // import { createRequire as _createRequire } from "node:module";
                let import_decl = create_import_decl(
                    create_require_ident,
                    Some(private_ident!("createRequire")),
                    "node:module",
                );

                items.insert(0, ModuleItem::ModuleDecl(ModuleDecl::Import(import_decl)));
                items
                    .insert(1, ModuleItem::Stmt(Stmt::Decl(Decl::Var(Box::new(require_var_decl)))));
            }
        }
    }
}

pub fn transform(config: Config) -> impl Pass {
    let unresolved_mark = Mark::new();
    let top_level_mark = Mark::new();

    (
        resolver(unresolved_mark, top_level_mark, true),
        visit_mut_pass(TransformShims {
            config,
            id_map: HashMap::new(),
            has_legacy_transform: false,
            has_require_transform: false,
            require_ident: None,
            create_require_ident: None,
            unresolved_ctxt: SyntaxContext::empty().apply_mark(unresolved_mark),
        }),
    )
}

#[cfg(test)]
mod tests {
    use swc_core::ecma::transforms::testing::test_inline;

    use super::*;

    test_inline!(
        Default::default(),
        |_| transform(serde_json::from_str(r#"{"target":"esm"}"#).unwrap()),
        fn_shims_esm,
        r#"
            console.log(__dirname);
            console.log(__filename);
        "#, // Input codes,
        r#"
            console.log(import.meta.dirname);
            console.log(import.meta.filename);
        "# // Output codes after transformed with plugin
    );

    test_inline!(
        Default::default(),
        |_| transform(serde_json::from_str(r#"{"target":"esm","legacy":true}"#).unwrap()),
        fn_shims_esm_legacy,
        r#"
            export const fileURLToPath = () => {};
            console.log(__dirname);
            console.log(__filename);
            export {} // 临时加, 解析为 module
        "#, // Input codes,
        r#"
            import { fileURLToPath } from "node:url";
            const fileURLToPath1 = ()=>{};
            export { fileURLToPath1 as fileURLToPath };
            console.log(fileURLToPath(new URL('.', import.meta.url)));
            console.log(fileURLToPath(import.meta.url));
            export { };
        "# // Output codes after transformed with plugin
    );

    test_inline!(
        Default::default(),
        |_| transform(serde_json::from_str(r#"{"target":"esm","legacy":true}"#).unwrap()),
        fn_shims_esm_legacy_2,
        r#"
            import { fileURLToPath } from "node:url";
            console.log(__dirname);
            console.log(__filename);
            export {} // 临时加, 解析为 module
        "#, // Input codes,
        r#"
            import { fileURLToPath } from "node:url";
            console.log(fileURLToPath(new URL('.', import.meta.url)));
            console.log(fileURLToPath(import.meta.url));
            export {}
        "# // Output codes after transformed with plugin
    );

    test_inline!(
        Default::default(),
        |_| transform(serde_json::from_str(r#"{"target":"cjs"}"#).unwrap()),
        fn_shims_cjs,
        r#"
            const __dirname = "1";
            const __filename = "2";
            console.log(__dirname, __filename);

            console.log(import.meta.dirname);
            console.log(import.meta.filename);
            // console.log(import.meta.url); // 无需处理, swc 支持转换
        "#, // Input codes,
        r#"
            const __dirname1 = "1";
            const __filename1 = "2";
            console.log(__dirname1, __filename1);

            console.log(__dirname);
            console.log(__filename);
            // console.log(require("url").pathToFileURL(__filename).toString());
        "# // Output codes after transformed with plugin
    );

    test_inline!(
        Default::default(),
        |_| transform(serde_json::from_str(r#"{"target":"cjs"}"#).unwrap()),
        fn_shims_cjs_2,
        r#"
            const { dirname, filename } = {};
            {
                // const __dirname = "1";
                // const __filename = "2";
                // console.log(__dirname, __filename);

                const { dirname, filename, url } = import.meta;
                console.log(dirname);
                console.log(filename);
                console.log(url);
            }
        "#, // Input codes,
        r#"
            const { dirname, filename } = {};
            {
                // const __dirname1 = "1";
                // const __filename1 = "2";
                // console.log(__dirname1, __filename1);

                console.log(__dirname);
                console.log(__filename);
                console.log(require("url").pathToFileURL(__filename).toString());
            }

        "# // Output codes after transformed with plugin
    );

    test_inline!(
        Default::default(),
        |_| transform(serde_json::from_str(r#"{"target":"cjs"}"#).unwrap()),
        fn_shims_cjs_3,
        r#"
            const d1 = "1"; const f1 = "2";
            {
                const { dirname: d1, filename: f1, url: u1 } = import.meta;
                console.log(d1);
                console.log(f1);
                console.log(u1);
            }
        "#, // Input codes,
        r#"
            const d1 = "1"; const f1 = "2";
            {
                console.log(__dirname);
                console.log(__filename);
                console.log(require("url").pathToFileURL(__filename).toString());
            }

        "# // Output codes after transformed with plugin
    );

    test_inline!(
        Default::default(),
        |_| transform(serde_json::from_str(r#"{"target":"esm"}"#).unwrap()),
        fn_shims_esm_require,
        r#"
            const fs = require('fs');
            const path = require('path');
            console.log(fs, path);
            export {}
        "#, // Input codes,
        r#"
            import { createRequire as _createRequire } from "node:module";
            const __require = _createRequire(import.meta.url);
            const fs = __require('fs');
            const path = __require('path');
            console.log(fs, path);
            export {}
        "# // Output codes after transformed with plugin
    );

    test_inline!(
        Default::default(),
        |_| transform(serde_json::from_str(r#"{"target":"esm"}"#).unwrap()),
        fn_shims_esm_require_4,
        r#"
            const __require = () => {};
            const _createRequire = () => {};
            const fs = require('fs');
            const path = require('path');
            console.log(fs, path);
            export {}
        "#, // Input codes,
        r#"
            import { createRequire as _createRequire } from "node:module";
            const __require = _createRequire(import.meta.url);
            const __require1 = ()=>{};
            const _createRequire1 = ()=>{};
            const fs = __require('fs');
            const path = __require('path');
            console.log(fs, path);
            export {}
        "# // Output codes after transformed with plugin
    );

    test_inline!(
        Default::default(),
        |_| transform(serde_json::from_str(r#"{"target":"esm"}"#).unwrap()),
        fn_shims_esm_require_2,
        r#"
            function loadModule() {
                return require('./module.js');
            }
            export {}
        "#, // Input codes,
        r#"
            import { createRequire as _createRequire } from "node:module";
            const __require = _createRequire(import.meta.url);
            function loadModule() {
                return __require('./module.js');
            }
            export {}
        "# // Output codes after transformed with plugin
    );

    test_inline!(
        Default::default(),
        |_| transform(serde_json::from_str(r#"{"target":"esm"}"#).unwrap()),
        fn_shims_esm_require_and_dirname,
        r#"
            const fs = require('fs');
            console.log(__dirname);
            export {}
        "#, // Input codes,
        r#"
            import { createRequire as _createRequire } from "node:module";
            const __require = _createRequire(import.meta.url);
            const fs = __require('fs');
            console.log(import.meta.dirname);
            export {}
        "# // Output codes after transformed with plugin
    );

    test_inline!(
        Default::default(),
        |_| transform(serde_json::from_str(r#"{"target":"esm"}"#).unwrap()),
        fn_shims_esm_require_create_require_conflict,
        r#"
            const createRequire = () => {};
            const fs = require('fs');
            const path = require('path');
            console.log(fs, path);
            export {}
        "#, // Input codes,
        r#"
            import { createRequire as _createRequire } from "node:module";
            const __require = _createRequire(import.meta.url);
            const createRequire1 = ()=>{};
            const fs = __require('fs');
            const path = __require('path');
            console.log(fs, path);
            export {}
        "# // Output codes after transformed with plugin
    );

    test_inline!(
        Default::default(),
        |_| transform(serde_json::from_str(r#"{"target":"esm"}"#).unwrap()),
        fn_shims_esm_dirname_shadowing,
        r#"
            // Global usage should be transformed
            console.log(__dirname, __filename);

            function test1() {
                // Local shadowing should NOT be transformed
                const __dirname = "/custom/path";
                const __filename = "/custom/file.js";
                console.log(__dirname, __filename);
            }

            // Global usage should be transformed again
            console.log(__dirname);
            export {}
        "#, // Input codes,
        r#"
            // Global usage should be transformed
            console.log(import.meta.dirname, import.meta.filename);

            function test1() {
                // Local shadowing should NOT be transformed
                const __dirname = "/custom/path";
                const __filename = "/custom/file.js";
                console.log(__dirname, __filename);
            }

            // Global usage should be transformed again
            console.log(import.meta.dirname);
            export {}
        "# // Output codes after transformed with plugin
    );

    test_inline!(
        Default::default(),
        |_| transform(serde_json::from_str(r#"{"target":"esm"}"#).unwrap()),
        fn_shims_esm_dirname_shadowing_nested,
        r#"
            console.log(__dirname);

            function outer() {
                console.log(__dirname); // Should transform

                function inner() {
                    const __dirname = "inner";
                    console.log(__dirname); // Should NOT transform (shadowed)
                }

                console.log(__dirname); // Should transform
            }
            export {}
        "#, // Input codes,
        r#"
            console.log(import.meta.dirname);

            function outer() {
                console.log(import.meta.dirname); // Should transform

                function inner() {
                    const __dirname = "inner";
                    console.log(__dirname); // Should NOT transform (shadowed)
                }

                console.log(import.meta.dirname); // Should transform
            }
            export {}
        "# // Output codes after transformed with plugin
    );

    test_inline!(
        Default::default(),
        |_| transform(serde_json::from_str(r#"{"target":"esm"}"#).unwrap()),
        fn_shims_esm_dirname_shadowing_block_scope,
        r#"
            console.log(__dirname);

            {
                const __dirname = "block";
                console.log(__dirname); // Should NOT transform (block scope)
            }

            console.log(__dirname); // Should transform
            export {}
        "#, // Input codes,
        r#"
            console.log(import.meta.dirname);

            {
                const __dirname = "block";
                console.log(__dirname); // Should NOT transform (block scope)
            }

            console.log(import.meta.dirname); // Should transform
            export {}
        "# // Output codes after transformed with plugin
    );

    test_inline!(
        Default::default(),
        |_| transform(serde_json::from_str(r#"{"target":"esm"}"#).unwrap()),
        fn_shims_esm_dirname_shadowing_param,
        r#"
            console.log(__dirname);

            function test(__dirname, __filename) {
                console.log(__dirname, __filename); // Should NOT transform (params)
            }

            console.log(__dirname); // Should transform
            export {}
        "#, // Input codes,
        r#"
            console.log(import.meta.dirname);

            function test(__dirname, __filename) {
                console.log(__dirname, __filename); // Should NOT transform (params)
            }

            console.log(import.meta.dirname); // Should transform
            export {}
        "# // Output codes after transformed with plugin
    );
}
