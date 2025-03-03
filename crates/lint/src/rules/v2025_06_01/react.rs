use serde_json::{json, Map, Value};

use crate::rules::react_config::{ReactConfig, ReactRuntime};
use crate::rules::rule_getter::RuleGetter;

impl ReactConfig {
    pub fn with_runtime(mut self, runtime: ReactRuntime) -> Self {
        self.runtime = runtime;
        self
    }
}

impl Default for ReactConfig {
    fn default() -> Self {
        Self {
            runtime: ReactRuntime::Automatic,
        }
    }
}

pub struct ReactRuleGetter {
    config: ReactConfig,
}

impl ReactRuleGetter {
    pub fn with_runtime(mut self, runtime: ReactRuntime) -> Self {
        self.config.runtime = runtime;
        self
    }
}

impl Default for ReactRuleGetter {
    fn default() -> Self {
        Self {
            config: ReactConfig::default(),
        }
    }
}

impl RuleGetter for ReactRuleGetter {
    fn get_def(&self) -> Map<String, Value> {
        json!({
           // react
          "react/jsx-key":2,
          "react/jsx-no-duplicate-props":2,
          "react/jsx-no-target-blank":[2,{
            "enforceDynamicLinks": "always",
            "warnOnSpreadAttributes":true,
            "allow_referrer":true,
            "links":true,
            "forms":false
          }],
          "react/jsx-no-undef":2,
          "react/jsx-props-no-spread-multi":2,
          "react/no-children-prop":2,
          "react/no-danger-with-children":2,
          "react/no-direct-mutation-state":2,
          "react/no-is-mounted":2,
          "react/no-string-refs":2,
          "react/void-dom-elements-no-children":2,
          "react/button-has-type":2,
          "react/iframe-missing-sandbox":2,
          "react/jsx-no-comment-textnodes":2,
          "react/no-array-index-key":1,
          "react/no-render-return-value":2,
          "react/jsx-boolean-value":1,
          "react/no-find-dom-node":1,
          "react/no-unknown-property":1,
          "react/self-closing-comp":1,
          "react/no-danger":0,
          "react/jsx-no-script-url":0,
          "react/jsx-no-useless-fragment":0,
          "react/prefer-es6-class":0,
          "react/style-prop-object":2,
          "react/require-render-return": 2,
          "react/checked-requires-onchange-or-readonly":2,
          "react/no-unescaped-entities":2,
          "react/rules-of-hooks":2,
          "react/jsx-curly-brace-presence": [1, {
            "props": "always",
            "children": "always",
            "propElementValues": "always"
          }],
          "react/no-set-state":0,
          "react/react-in-jsx-scope": if self.config.runtime == ReactRuntime::Automatic { 0 } else { 2 },
          // react_perf
          "react_perf/jsx-no-jsx-as-prop":1,
          "react_perf/jsx-no-new-array-as-prop":1,
          "react_perf/jsx-no-new-function-as-prop":1,
          "react_perf/jsx-no-new-object-as-prop":1,
        })
        .as_object()
        .map_or(Map::new(), |map| map.to_owned())
    }
}
