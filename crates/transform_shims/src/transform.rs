use serde::Deserialize;

use swc_core::ecma::{
    ast::{self, Pass},
    transforms::testing::test_inline,
    visit::{noop_visit_mut_type, visit_mut_pass, VisitMut},
};

#[derive(Clone, Debug, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct Config {
    #[serde(default)]
    pub legacy: bool,
}

struct TransformShim {
    config: Config,
}

impl VisitMut for TransformShim {
    noop_visit_mut_type!();

    // __dirname, __filename -> import.meta.dirname, import.meta.filename
    fn visit_mut_ident(&mut self, i: &mut ast::Ident) {
        if self.config.legacy {
            // url.fileURLToPath(import.meta.url), url.fileURLToPath(new URL('.', import.meta.url))
            // TODO: Implement this
            return;
        }

        if i.sym == *"__dirname" {
            i.sym = "import.meta.dirname".into();
        } else if i.sym == *"__filename" {
            i.sym = "import.meta.filename".into();
        }
    }
}

pub fn init(config: Config) -> impl Pass {
    visit_mut_pass(TransformShim { config })
}

test_inline!(
    Default::default(),
    |_| init(serde_json::from_str(r#"{}"#).unwrap()),
    fn_shims1,
    r#"
        console.log(__dirname);
        console.log(__filename);
    "#, // Input codes,
    r#"
        console.log(import.meta.dirname);
        console.log(import.meta.filename);
    "# // Output codes after transformed with plugin
);
