use serde::Deserialize;
use std::collections::HashMap;
use swc_core::{
    common::{DUMMY_SP, util::take::Take},
    ecma::{
        ast::{
            Decl, Expr, Ident, ImportDecl, ImportNamedSpecifier, ImportSpecifier, KeyValuePatProp,
            MemberProp, MetaPropExpr, MetaPropKind, ModuleDecl, ModuleItem, ObjectPat,
            ObjectPatProp, Pass, Pat, PropName, Stmt, VarDeclarator,
        },
        utils::{quote_ident, quote_str},
        visit::{VisitMut, VisitMutWith, noop_visit_mut_type, visit_mut_pass},
    },
};

#[derive(Clone, Debug, Deserialize, Default, PartialEq)]
#[serde(rename_all = "camelCase")]
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
    id_map: HashMap<String, String>,
    has_legacy_transform: bool,
}

const CJS_DIRNAME: &str = "__dirname";
const CJS_FILENAME: &str = "__filename";
const CJS_URL: &str = "require(\"url\").pathToFileURL(__filename).toString()";

const ESM_DIRNAME: &str = "import.meta.dirname";
const ESM_FILENAME: &str = "import.meta.filename";
const ESM_DIRNAME_LEGACY: &str = "fileURLToPath(new URL('.', import.meta.url))";
const ESM_FILENAME_LEGACY: &str = "fileURLToPath(import.meta.url)";

impl VisitMut for TransformShims {
    noop_visit_mut_type!();

    // esm support __dirname, __filename
    fn visit_mut_ident(&mut self, i: &mut Ident) {
        // 暂不考虑 scope 中有 __dirname, __filename 的情况
        if self.config.target == Target::ESM {
            if self.config.legacy {
                let sym = match i.sym.as_ref() {
                    "__dirname" => ESM_DIRNAME_LEGACY,
                    "__filename" => ESM_FILENAME_LEGACY,
                    _ => return,
                };
                i.sym = sym.into();
                self.has_legacy_transform = true;
            } else {
                let sym = match i.sym.as_ref() {
                    "__dirname" => ESM_DIRNAME,
                    "__filename" => ESM_FILENAME,
                    _ => return,
                };

                i.sym = sym.into();
            }
        }

        if self.config.target == Target::CJS {
            if let Some((_, value)) = self.id_map.get_key_value(&i.to_string()) {
                let sym = match value.as_str() {
                    "dirname" => CJS_DIRNAME,
                    "filename" => CJS_FILENAME,
                    "url" => CJS_URL,
                    _ => return,
                };

                i.sym = sym.into()
            }
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
                        *e = quote_ident!(sym).into();
                        // *e = Ident::new_no_ctxt(sym.into(), DUMMY_SP).into();
                    }
                }
            }
        }
    }

    // cjs support {filename,dirname} = import.meta
    // 删除 ctxt 同一个 scope 中的 import.meta
    // ident -> dirname -> import.meta.dirname, filename -> import.meta.filename
    fn visit_mut_var_declarator(&mut self, v: &mut VarDeclarator) {
        v.visit_mut_children_with(self);

        if self.config.target == Target::CJS {
            let is_import_meta = v.init.as_ref().map_or(false, |init| {
                matches!(&**init, Expr::MetaProp(MetaPropExpr { kind, .. }) if *kind == MetaPropKind::ImportMeta)
            });

            if is_import_meta {
                if let Pat::Object(ObjectPat { props, .. }) = &v.name {
                    props.iter().for_each(|prop| match prop {
                        ObjectPatProp::KeyValue(KeyValuePatProp { key, value, .. }) => {
                            if let (Pat::Ident(ident), PropName::Ident(name)) = (&**value, &key) {
                                self.id_map.insert(ident.to_string(), name.sym.to_string());
                            }
                        }

                        ObjectPatProp::Assign(assign) => {
                            self.id_map.insert(assign.key.to_string(), assign.key.sym.to_string());
                        }
                        _ => return,
                    });
                }

                v.name.take();
            }
        }
    }

    // remove var decl ↓↓↓
    // const { dirname, filename } = import.meta; -> const ;
    fn visit_mut_var_declarators(&mut self, vars: &mut Vec<VarDeclarator>) {
        vars.visit_mut_children_with(self);

        vars.retain(|node| {
            // We want to remove the node, so we should return false.
            if node.name.is_invalid() {
                return false;
            }

            // Return true if we want to keep the node.
            true
        });
    }

    // const ; -> ;
    fn visit_mut_stmt(&mut self, stmt: &mut Stmt) {
        stmt.visit_mut_children_with(self);

        match stmt {
            Stmt::Decl(Decl::Var(var)) => {
                if var.decls.is_empty() {
                    stmt.take();
                }
            }
            _ => {}
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

        let is_has_import_url = items.iter().any(|item| {
            if let ModuleItem::ModuleDecl(ModuleDecl::Import(decl)) = item {
                if decl.src.value == "node:url"
                    && decl.specifiers.iter().any(|specifier| {
                        if let ImportSpecifier::Named(ImportNamedSpecifier { local, .. }) =
                            specifier
                        {
                            return local.sym.as_ref() == "fileURLToPath";
                        }
                        false
                    })
                {
                    return true;
                }
            }
            false
        });

        if self.config.target == Target::ESM
            && self.config.legacy
            && self.has_legacy_transform
            && !is_has_import_url
        {
            // import { fileURLToPath } from "node:url";
            let import_decl = ImportDecl {
                span: DUMMY_SP,
                specifiers: vec![ImportSpecifier::Named(ImportNamedSpecifier {
                    span: DUMMY_SP,
                    // TODO: fileURLToPath 重名问题
                    local: "fileURLToPath".into(),
                    imported: None,
                    is_type_only: false,
                })],
                src: Box::new(quote_str!("node:url")),
                type_only: false,
                with: None,
                phase: Default::default(),
            };

            items.insert(0, ModuleItem::ModuleDecl(ModuleDecl::Import(import_decl)));
        }
    }
}

pub fn transform_shims(config: Config) -> impl Pass {
    visit_mut_pass(TransformShims {
        config,
        id_map: HashMap::with_capacity(4),
        has_legacy_transform: false,
    })
}
