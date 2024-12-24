use serde::Deserialize;

use swc_core::{
    common::DUMMY_SP,
    ecma::{
        ast::{Expr, Ident, MemberProp, MetaPropExpr, MetaPropKind, Pass},
        transforms::testing::test_inline,
        visit::{noop_visit_mut_type, visit_mut_pass, VisitMut, VisitMutWith},
    },
};

#[derive(Clone, Debug, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct Config {
    #[serde(default)]
    pub legacy: bool,

    // "cjs" | "esm"
    pub target: String,
}

struct TransformShims {
    config: Config,
}

impl VisitMut for TransformShims {
    noop_visit_mut_type!();

    // esm support __dirname, __filename
    fn visit_mut_ident(&mut self, i: &mut Ident) {
        // 暂不考虑 scope 中有 __dirname, __filename 的情况
        if self.config.target == "esm" {
            if self.config.legacy {
                // url.fileURLToPath(import.meta.url), url.fileURLToPath(new URL('.', import.meta.url))
                // TODO: Implement this
                return;
            }

            let sym = match i.sym.as_ref() {
                "__dirname" => "import.meta.dirname",
                "__filename" => "import.meta.filename",
                _ => return,
            };

            i.sym = sym.into();
        }
    }

    // cjs support import.meta.dirname, import.meta.filename
    fn visit_mut_expr(&mut self, e: &mut Expr) {
        if self.config.target == "cjs" {
            if let Expr::Member(n) = e {
                if let (Expr::MetaProp(MetaPropExpr { kind, .. }), MemberProp::Ident(prop)) =
                    (&*n.obj, &n.prop)
                {
                    if *kind == MetaPropKind::ImportMeta {
                        let sym = match prop.sym.as_ref() {
                            "dirname" => "__dirname",
                            "filename" => "__filename",
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
}

pub fn init(config: Config) -> impl Pass {
    visit_mut_pass(TransformShims { config })
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
    "#, // Input codes,
    r#"
        console.log(__dirname);
        console.log(__filename);
    "# // Output codes after transformed with plugin
);
