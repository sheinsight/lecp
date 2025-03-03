use serde::Serialize;

pub const DEFAULT_PATTERNS: &str = "**/*.{js,jsx,ts,tsx,cjs,mjs,cts,mts}";

pub const DEFAULT_IGNORE_PATTERNS: &[&str] = &[
    "**/node_modules/**",
    "**/dist/**",
    "**/build/**",
    "**/coverage/**",
    "**/*.d.ts",
    "node_modules",
];

pub const DEFAULT_TEST_PATTERNS: &[&str] = &[
    "**/test/**",
    "**/tests/**",
    "**/spec/**",
    "**/specs/**",
    "*.spec.ts",
    "*.spec.tsx",
    "*.test.ts",
    "*.test.tsx",
    "*.min.js",
    "*.min.css",
    "*.d.ts",
];

pub const DEFAULT_DTS_PATTERNS: &[&str] = &["**/*.d.ts"];

#[derive(Debug, Clone, Serialize)]
pub struct WalkPatterns<'a> {
    pub walk: &'a str,
    pub ignore: &'a [&'a str],
    pub testing: &'a [&'a str],
    pub dts: &'a [&'a str],
}

impl<'a> Default for WalkPatterns<'a> {
    fn default() -> Self {
        Self {
            walk: DEFAULT_PATTERNS,
            ignore: DEFAULT_IGNORE_PATTERNS,
            testing: DEFAULT_TEST_PATTERNS,
            dts: DEFAULT_DTS_PATTERNS,
        }
    }
}

impl<'a> WalkPatterns<'a> {
    pub fn with_walk(mut self, walk: &'a str) -> Self {
        self.walk = walk;
        self
    }

    pub fn with_ignore(mut self, ignore: &'a [&'static str]) -> Self {
        self.ignore = ignore;
        self
    }

    pub fn with_testing(mut self, testing: &'a [&'static str]) -> Self {
        self.testing = testing;
        self
    }

    pub fn with_dts(mut self, dts: &'a [&'static str]) -> Self {
        self.dts = dts;
        self
    }

    pub fn build(self) -> Self {
        self
    }
}
