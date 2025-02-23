#[derive(Clone, Copy)]
pub enum AllowWarnDeny {
    Allow = 0, // Off
    Warn = 1,  // Warn
    Deny = 2,  // Error
}

pub struct NoUnusedVars {
    allow_warn_deny: AllowWarnDeny,
    args: NoUnusedVarsArgs,
}

impl NoUnusedVars {
    pub fn allow(args: NoUnusedVarsArgs) -> Self {
        Self {
            allow_warn_deny: AllowWarnDeny::Allow,
            args,
        }
    }

    pub fn warn(args: NoUnusedVarsArgs) -> Self {
        Self {
            allow_warn_deny: AllowWarnDeny::Warn,
            args,
        }
    }

    pub fn deny(args: NoUnusedVarsArgs) -> Self {
        Self {
            allow_warn_deny: AllowWarnDeny::Deny,
            args,
        }
    }
}

pub struct NoUnusedVarsArgs {
    pub vars: AllowWarnDeny,
    pub args: AllowWarnDeny,
    pub caught_errors: AllowWarnDeny,
    pub vars_ignore_pattern: Option<String>,
    pub args_ignore_pattern: Option<String>,
    pub caught_errors_ignore_pattern: Option<String>,
    pub destructured_array_ignore_pattern: Option<String>,
    pub ignore_rest_siblings: bool,
    pub ignore_class_with_static_init_block: bool,
    pub report_used_ignore_pattern: bool,
}

pub struct NoConstantConditionOptions {}

pub struct RuleBuilder {
    pub no_constant_condition: AllowWarnDeny,
    pub no_empty_static_block: AllowWarnDeny,
    pub radix: AllowWarnDeny,
    // pub no_unused_vars: (AllowWarnDeny, NoUnusedVarsArgs),
}

impl RuleBuilder {
    pub fn new() -> Self {
        Self {
            no_constant_condition: AllowWarnDeny::Allow,
            no_empty_static_block: AllowWarnDeny::Allow,
            radix: AllowWarnDeny::Allow,
            // no_unused_vars: (AllowWarnDeny::Allow, NoUnusedVarsArgs::default()),
        }
    }

    pub fn no_constant_condition(&mut self, value: AllowWarnDeny) -> &mut Self {
        self.no_constant_condition = value;
        self
    }

    pub fn no_empty_static_block(&mut self, value: AllowWarnDeny) -> &mut Self {
        self.no_empty_static_block = value;
        self
    }

    pub fn radix(&mut self, value: AllowWarnDeny) -> &mut Self {
        self.radix = value;
        self
    }

    // pub fn no_unused_vars(&mut self, value: AllowWarnDeny, options: NoUnusedVarsArgs) -> &mut Self {
    //     self.no_unused_vars = (value, options);
    //     self
    // }

    pub fn build(self) -> Self {
        self
    }
}
