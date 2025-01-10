use serde::Deserialize;
use std::collections::HashMap;
use swc_core::common::util::take::Take;

use swc_core::{
    common::DUMMY_SP,
    ecma::{
        ast::{
            Decl, Expr, Ident, KeyValuePatProp, MemberProp, MetaPropExpr, MetaPropKind, ObjectPat,
            ObjectPatProp, Pass, Pat, PropName, Stmt, VarDeclarator,
        },
        transforms::testing::test_inline,
        visit::{noop_visit_mut_type, visit_mut_pass, VisitMut, VisitMutWith},
    },
};

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

    id_map: HashMap<String, String>,
}

const CJS_DIRNAME: &str = "__dirname";
const CJS_FILENAME: &str = "__filename";
const CJS_URL: &str = "require(\"url\").pathToFileURL(__filename).toString()";

const ESM_DIRNAME: &str = "import.meta.dirname";
const ESM_FILENAME: &str = "import.meta.filename";

impl VisitMut for TransformShims {
    noop_visit_mut_type!();

    // esm support __dirname, __filename
    fn visit_mut_ident(&mut self, i: &mut Ident) {
        // 暂不考虑 scope 中有 __dirname, __filename 的情况
        if self.config.target == Target::ESM {
            if self.config.legacy {
                // import url from 'node:url';
                // __filename: url.fileURLToPath(import.meta.url),
                // __dirname: url.fileURLToPath(new URL('.', import.meta.url))
                // TODO: Implement this
                return;
            }

            let sym = match i.sym.as_ref() {
                "__dirname" => ESM_DIRNAME,
                "__filename" => ESM_FILENAME,
                _ => return,
            };

            i.sym = sym.into();
        }

        if self.config.target == Target::CJS {
            if let Some((_, value)) = self.id_map.get_key_value(&i.to_string()) {
                i.sym = match value.as_str() {
                    "dirname" => CJS_DIRNAME.into(),
                    "filename" => CJS_FILENAME.into(),
                    "url" => CJS_URL.into(),
                    _ => return,
                };
            }
        }
    }

    // cjs support import.meta.dirname, import.meta.filename
    fn visit_mut_expr(&mut self, e: &mut Expr) {
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
                        *e = Expr::Ident(Ident::new_no_ctxt(sym.into(), DUMMY_SP));
                    }
                }
            }
        }

        e.visit_mut_children_with(self);
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
                            self.id_map
                                .insert(assign.key.to_string(), assign.key.sym.to_string());
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
    fn visit_mut_stmt(&mut self, s: &mut Stmt) {
        s.visit_mut_children_with(self);

        match s {
            Stmt::Decl(Decl::Var(var)) => {
                if var.decls.is_empty() {
                    s.take();
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
        stmts.retain(|s| {
            // We use `matches` macro as this match is trivial.
            !matches!(s, Stmt::Empty(..))
        });
    }
}

pub fn init(config: Config) -> impl Pass {
    visit_mut_pass(TransformShims {
        config,
        id_map: HashMap::with_capacity(4),
    })
}

test_inline!(
    Default::default(),
    |_| init(serde_json::from_str(r#"{"target":"esm"}"#).unwrap()),
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
    |_| init(serde_json::from_str(r#"{"target":"cjs"}"#).unwrap()),
    fn_shims_cjs,
    r#"
        console.log(import.meta.dirname);
        console.log(import.meta.filename);
        // console.log(import.meta.url); // 无需处理, swc 支持转换
    "#, // Input codes,
    r#"
        console.log(__dirname);
        console.log(__filename);
        // console.log(require("url").pathToFileURL(__filename).toString());
    "# // Output codes after transformed with plugin
);

test_inline!(
    Default::default(),
    |_| init(serde_json::from_str(r#"{"target":"cjs"}"#).unwrap()),
    fn_shims_cjs_2,
    r#"
        const { dirname, filename } = {};
        {
            const { dirname, filename, url } = import.meta;
            console.log(dirname);
            console.log(filename);
            console.log(url);
        }
    "#, // Input codes,
    r#"
        const { dirname, filename } = {};
        {
            console.log(__dirname);
            console.log(__filename);
            console.log(require("url").pathToFileURL(__filename).toString());
        }

    "# // Output codes after transformed with plugin
);

test_inline!(
    Default::default(),
    |_| init(serde_json::from_str(r#"{"target":"cjs"}"#).unwrap()),
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
