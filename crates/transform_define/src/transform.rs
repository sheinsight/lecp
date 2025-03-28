use serde_json::Value;

use swc_core::ecma::transforms::testing::test_inline;
use swc_core::{
    common::DUMMY_SP,
    ecma::{
        ast::{
            ArrayLit, Expr, ExprOrSpread, Ident, ImportSpecifier, KeyValueProp, Lit, MemberExpr,
            MemberProp, ObjectLit, Pass, Prop, PropName, PropOrSpread, UnaryOp,
        },
        visit::{visit_mut_pass, VisitMut, VisitMutWith},
    },
};

#[derive(Default)]
pub struct TransformDefine {
    options: Value,
    in_import_specifier: bool,
}

impl TransformDefine {
    pub fn new(options: Value) -> Self {
        Self { options, ..Default::default() }
    }
}

pub fn transform_define(options: Value) -> impl Pass {
    visit_mut_pass(TransformDefine::new(options))
}

impl VisitMut for TransformDefine {
    // Implement necessary visit_mut_* methods for actual custom transform.
    // A comprehensive list of possible visitor methods can be found here:
    // https://rustdoc.swc.rs/swc_ecma_visit/trait.VisitMut.html

    fn visit_mut_import_specifier(&mut self, node: &mut ImportSpecifier) {
        let old_in_import_specifier = self.in_import_specifier;

        self.in_import_specifier = true;
        node.visit_mut_children_with(self);
        self.in_import_specifier = old_in_import_specifier;
    }

    // scene: const x = { version: VERSION };
    fn visit_mut_ident(&mut self, ident: &mut Ident) {
        ident.visit_mut_children_with(self);

        // Don't transform import_specifier ident
        if self.in_import_specifier {
            return;
        }

        let name = ident.sym.as_ref();
        let value = &self.options[&name];

        let value = match value {
            Value::Null => return,
            _ => value.to_string(),
        };

        ident.sym = value.into();
    }

    fn visit_mut_expr(&mut self, e: &mut Expr) {
        // scene: process.env.NODE_ENV;
        // Expr::Member -> Expr::Lit (~~visit_mut_member_expr~~)
        // not visit_mut_children_with(self)
        if let Expr::Member(n) = e {
            let mut list = vec![];
            let path = get_node_path(n.clone(), &mut list);
            let name = path.join(".");
            let mut value = &self.options[&name];

            // 从 path 中取值 (like lodash.get)
            if value.is_null() {
                path.iter().for_each(|p: &String| {
                    value = if value.is_null() { &self.options[p] } else { &value[p] };
                });
            }

            let expr = create_expr(value.clone());
            if let Some(expr) = expr {
                *e = expr;
            }
        }

        e.visit_mut_children_with(self);

        // scene: typeof window;
        // Expr::Unary -> Expr::Lit (~~visit_mut_unary_expr~~)
        if let Expr::Unary(n) = e {
            if n.op != UnaryOp::TypeOf {
                return;
            }

            let ident = match n.arg.as_ident() {
                Some(ident) => ident,
                None => return,
            };

            let name = ident.sym.as_ref();
            let value = &self.options[format!("typeof {}", &name)];

            let expr = create_expr(value.clone());
            if let Some(expr) = expr {
                *e = expr;
            }
        }
    }
}

// 获取 MemberExpr 的路径
fn get_node_path(e: MemberExpr, paths: &mut Vec<String>) -> &mut Vec<String> {
    match e.prop {
        MemberProp::Ident(i) => {
            paths.insert(0, format!("{}", i.sym));
        }
        _ => (),
    }

    match *e.obj {
        Expr::Ident(i) => {
            paths.insert(0, format!("{}", i.sym));
        }
        Expr::Member(e1) => {
            get_node_path(e1, paths);
        }
        _ => {}
    }

    paths
}

fn create_expr(value: Value) -> Option<Expr> {
    let x = match value {
        Value::Null => return None,
        Value::String(s) => Lit::from(s).into(),
        Value::Bool(b) => Lit::from(b).into(),
        Value::Number(n) => Lit::from(n.as_f64()?).into(),
        Value::Array(arr) => ArrayLit {
            span: DUMMY_SP,
            elems: arr
                .into_iter()
                .filter_map(|v| create_expr(v).map(Box::new).map(ExprOrSpread::from).map(Some))
                .collect(),
        }
        .into(),
        Value::Object(obj) => ObjectLit {
            span: DUMMY_SP,
            props: obj
                .into_iter()
                .filter_map(|(k, v)| {
                    create_expr(v)
                        .map(|v| KeyValueProp { key: PropName::Str(k.into()), value: Box::new(v) })
                        .map(Prop::KeyValue)
                        .map(Box::new)
                        .map(PropOrSpread::Prop)
                })
                .collect(),
        }
        .into(),
    };

    Some(x)
}

test_inline!(
    Default::default(),
    |_| transform_define(
        serde_json::from_str(
            r#"
            {
                "STR": "string",
                "NUM": 0,
                "BOOL": false,
                "ARR": [],
                "OBJ": {}
            }"#
        )
        .unwrap()
    ),
    fn_ident,
    r#"
        STR;
        NUM;
        BOOL;
        ARR;
        OBJ;
        NOT_DEF;
        window.aaa = { version: STR };
    "#, // Input codes,
    r#"
        "string";
        0;
        false;
        [];
        {};
        NOT_DEF;
        window.aaa = { version: "string" };
    "# // Output codes after transformed with plugin
);

test_inline!(
    Default::default(),
    |_| transform_define(
        serde_json::from_str(
            r#"
            {
                "STR": "string"
            }"#
        )
        .unwrap()
    ),
    fn_import,
    r#"
        import { STR } from "pkg1";
        import STR from "pkg1";
        import * as STR from "pkg1";
        STR;
    "#, // Input codes,
    r#"
        import { STR } from "pkg1";
        import STR from "pkg1";
        import * as STR from "pkg1";
        "string";
    "# // Output codes after transformed with plugin
);

test_inline!(
    Default::default(),
    |_| transform_define(
        serde_json::from_str(
            r#"
            {
                "typeof window":  "object"
            }"#
        )
        .unwrap()
    ),
    fn_typeof,
    r#"
        typeof window;
        typeof window === "object";
    "#, // Input codes,
    r#"
        "object";
        "object" === "object";
    "# // Output codes after transformed with plugin
);

// 'process.env.NODE_ENV 被正确转化-字符串参数
test_inline!(
    Default::default(),
    |_| transform_define(
        serde_json::from_str(
            r#"
            {
                "process.env.NODE_ENV": "production",
                "process.env.BOOL": true,
                "process.env.NUM": 1,
                "process.env.ARR": [],
                "process.env.OBJ": {}
            }"#
        )
        .unwrap()
    ),
    fn_member_expr,
    r#"
        if (process.env.NODE_ENV === "production") console.log(true);
        if (process.env.NODE_ENV) console.log(true);

        if (process.env.BOOL === "production") console.log(true);
        if (process.env.BOOL) console.log(true);

        if (process.env.NUM === "production") console.log(true);
        if (process.env.NUM) console.log(true);

        if (process.env.ARR === "production") console.log(true);
        if (process.env.ARR) console.log(true);

        if (process.env.OBJ === "production") console.log(true);
        if (process.env.OBJ) console.log(true);
    "#, // Input codes,
    r#"
        if ("production" === "production") console.log(true);
        if ("production") console.log(true);

        if (true === "production") console.log(true);
        if (true) console.log(true);

        if (1 === "production") console.log(true);
        if (1) console.log(true);

        if ([] === "production") console.log(true);
        if ([]) console.log(true);

        if (({}) === "production") console.log(true);
        if ({}) console.log(true);
    "# // Output codes after transformed with plugin
);

// 'process.env.NODE_ENV 被正确转化-对象参数
test_inline!(
    Default::default(),
    |_| transform_define(
        serde_json::from_str(
            r#"
            {
                "process": {
                    "env": {
                        "NODE_ENV": "production",
                        "BOOL": true,
                        "NUM": 1,
                        "ARR": [],
                        "OBJ": {}
                    }
                }
            }"#,
        )
        .unwrap()
    ),
    fn_member_expr2,
    r#"
        if (process.env.NODE_ENV === "production") console.log(true);
        if (process.env.NODE_ENV) console.log(true);

        if (process.env.BOOL === "production") console.log(true);
        if (process.env.BOOL) console.log(true);

        if (process.env.NUM === "production") console.log(true);
        if (process.env.NUM) console.log(true);

        if (process.env.ARR === "production") console.log(true);
        if (process.env.ARR) console.log(true);

        if (process.env.OBJ === "production") console.log(true);
        if (process.env.OBJ) console.log(true);
    "#, // Input codes,
    r#"
        if ("production" === "production") console.log(true);
        if ("production") console.log(true);

        if (true === "production") console.log(true);
        if (true) console.log(true);

        if (1 === "production") console.log(true);
        if (1) console.log(true);

        if ([] === "production") console.log(true);
        if ([]) console.log(true);

        if (({}) === "production") console.log(true);
        if ({}) console.log(true);
    "# // Output codes after transformed with plugin
);
