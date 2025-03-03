use bitflags::bitflags;
use rustc_hash::FxHashMap;
use serde::{Serialize, Serializer};

bitflags! {
    #[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
    pub struct Environments: u64 {
        const Browser = 1 << 0;
        const Node = 1 << 1;
        const CommonJS = 1 << 2;
        const SharedNodeBrowser = 1 << 3;
        const Es6 = 1 << 4;
        const Es2016 = 1 << 5;
        const Es2017 = 1 << 6;
        const Es2018 = 1 << 7;
        const Es2019 = 1 << 8;
        const Es2020 = 1 << 9;
        const Es2021 = 1 << 10;
        const Es2022 = 1 << 11;
        const Es2023 = 1 << 12;
        const Es2024 = 1 << 13;
        const Worker = 1 << 14;
        const Amd = 1 << 15;
        const Mocha = 1 << 16;
        const Jasmine = 1 << 17;
        const Jest = 1 << 18;
        const PhantomJS = 1 << 19;
        const Protractor = 1 << 20;
        const Qunit = 1 << 21;
        const JQuery = 1 << 22;
        const PrototypeJS = 1 << 23;
        const ShellJS = 1 << 24;
        const Meteor = 1 << 25;
        const Mongo = 1 << 26;
        const AppleScript = 1 << 27;
        const NaShorn = 1 << 28;
        const ServiceWorker = 1 << 29;
        const AtomTest = 1 << 30;
        const EmberTest = 1 << 31;
        const WebExtensions = 1 << 32;
        const GreaseMonkey = 1 << 33;
    }
}

impl Default for Environments {
    fn default() -> Self {
        Environments::Es2024 | Environments::Browser
    }
}

impl Into<&'static str> for Environments {
    fn into(self) -> &'static str {
        match self {
            Self::Browser => "browser",
            Self::Node => "node",
            Self::CommonJS => "commonjs",
            Self::SharedNodeBrowser => "shared-node-browser",
            Self::Es6 => "es6",
            Self::Es2016 => "es2016",
            Self::Es2017 => "es2017",
            Self::Es2018 => "es2018",
            Self::Es2019 => "es2019",
            Self::Es2020 => "es2020",
            Self::Es2021 => "es2021",
            Self::Es2022 => "es2022",
            Self::Es2023 => "es2023",
            Self::Es2024 => "es2024",
            Self::Worker => "worker",
            Self::Amd => "amd",
            Self::Mocha => "mocha",
            Self::Jasmine => "jasmine",
            Self::Jest => "jest",
            Self::PhantomJS => "phantomjs",
            Self::Protractor => "protractor",
            Self::Qunit => "qunit",
            Self::JQuery => "jquery",
            Self::PrototypeJS => "prototypejs",
            Self::ShellJS => "shelljs",
            Self::Meteor => "meteor",
            Self::Mongo => "mongo",
            Self::AppleScript => "applescript",
            Self::NaShorn => "nashorn",
            Self::ServiceWorker => "serviceworker",
            Self::AtomTest => "atomtest",
            Self::EmberTest => "embertest",
            Self::WebExtensions => "webextensions",
            Self::GreaseMonkey => "greasemonkey",
            _ => unreachable!(),
        }
    }
}

impl Serialize for Environments {
    fn serialize<S: Serializer>(&self, serializer: S) -> Result<S::Ok, S::Error> {
        let mut map = FxHashMap::default();
        let all_environments = [
            ("browser", Self::Browser.bits()),
            ("node", Self::Node.bits()),
            ("commonjs", Self::CommonJS.bits()),
            ("shared-node-browser", Self::SharedNodeBrowser.bits()),
            ("es6", Self::Es6.bits()),
            ("es2016", Self::Es2016.bits()),
            ("es2017", Self::Es2017.bits()),
            ("es2018", Self::Es2018.bits()),
            ("es2019", Self::Es2019.bits()),
            ("es2020", Self::Es2020.bits()),
            ("es2021", Self::Es2021.bits()),
            ("es2022", Self::Es2022.bits()),
            ("es2023", Self::Es2023.bits()),
            ("es2024", Self::Es2024.bits()),
            ("worker", Self::Worker.bits()),
            ("amd", Self::Amd.bits()),
            ("mocha", Self::Mocha.bits()),
            ("jasmine", Self::Jasmine.bits()),
            ("jest", Self::Jest.bits()),
            ("phantomjs", Self::PhantomJS.bits()),
            ("protractor", Self::Protractor.bits()),
            ("qunit", Self::Qunit.bits()),
            ("jquery", Self::JQuery.bits()),
            ("prototypejs", Self::PrototypeJS.bits()),
            ("shelljs", Self::ShellJS.bits()),
            ("meteor", Self::Meteor.bits()),
            ("mongo", Self::Mongo.bits()),
            ("applescript", Self::AppleScript.bits()),
            ("nashorn", Self::NaShorn.bits()),
            ("serviceworker", Self::ServiceWorker.bits()),
            ("atomtest", Self::AtomTest.bits()),
            ("embertest", Self::EmberTest.bits()),
            ("webextensions", Self::WebExtensions.bits()),
            ("greasemonkey", Self::GreaseMonkey.bits()),
        ];

        // 检查每个环境是否被设置，并添加到 map 中
        for (name, bits) in all_environments {
            map.insert(
                name.to_string(),
                self.contains(Self::from_bits_truncate(bits)),
            );
        }

        map.serialize(serializer)
    }
}

impl Environments {
    /// 获取所有已设置的环境
    pub fn to_hash_map(&self) -> FxHashMap<String, bool> {
        let mut map = FxHashMap::default();

        // 定义所有环境的映射
        let all_environments = [
            ("browser", Self::Browser.bits()),
            ("node", Self::Node.bits()),
            ("commonjs", Self::CommonJS.bits()),
            ("shared-node-browser", Self::SharedNodeBrowser.bits()),
            ("es6", Self::Es6.bits()),
            ("es2016", Self::Es2016.bits()),
            ("es2017", Self::Es2017.bits()),
            ("es2018", Self::Es2018.bits()),
            ("es2019", Self::Es2019.bits()),
            ("es2020", Self::Es2020.bits()),
            ("es2021", Self::Es2021.bits()),
            ("es2022", Self::Es2022.bits()),
            ("es2023", Self::Es2023.bits()),
            ("es2024", Self::Es2024.bits()),
            ("worker", Self::Worker.bits()),
            ("amd", Self::Amd.bits()),
            ("mocha", Self::Mocha.bits()),
            ("jasmine", Self::Jasmine.bits()),
            ("jest", Self::Jest.bits()),
            ("phantomjs", Self::PhantomJS.bits()),
            ("protractor", Self::Protractor.bits()),
            ("qunit", Self::Qunit.bits()),
            ("jquery", Self::JQuery.bits()),
            ("prototypejs", Self::PrototypeJS.bits()),
            ("shelljs", Self::ShellJS.bits()),
            ("meteor", Self::Meteor.bits()),
            ("mongo", Self::Mongo.bits()),
            ("applescript", Self::AppleScript.bits()),
            ("nashorn", Self::NaShorn.bits()),
            ("serviceworker", Self::ServiceWorker.bits()),
            ("atomtest", Self::AtomTest.bits()),
            ("embertest", Self::EmberTest.bits()),
            ("webextensions", Self::WebExtensions.bits()),
            ("greasemonkey", Self::GreaseMonkey.bits()),
        ];

        // 检查每个环境是否被设置，并添加到 map 中
        for (name, bits) in all_environments {
            map.insert(
                name.to_string(),
                self.contains(Self::from_bits_truncate(bits)),
            );
        }

        map
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_environments() {
        let env = Environments::Es2016 | Environments::Es2017;

        assert!(env.contains(Environments::Es2016));
        assert!(env.contains(Environments::Es2017));
        assert!(!env.contains(Environments::Es2018));
        assert!(!env.contains(Environments::Es2019));
        assert!(!env.contains(Environments::Es2020));
        assert!(!env.contains(Environments::Es2021));
        assert!(!env.contains(Environments::Es2022));
        assert!(!env.contains(Environments::Es2023));
        assert!(!env.contains(Environments::Es2024));

        let map = env.to_hash_map();

        assert!(map.get("es2016").unwrap());
        assert!(map.get("es2017").unwrap());
        assert!(!map.get("es2018").unwrap());
        assert!(!map.get("es2019").unwrap());
        assert!(!map.get("es2020").unwrap());
        assert!(!map.get("es2021").unwrap());
        assert!(!map.get("es2022").unwrap());
        assert!(!map.get("es2023").unwrap());
        assert!(!map.get("es2024").unwrap());
        assert!(!map.get("browser").unwrap());
        assert!(!map.get("node").unwrap());
        assert!(!map.get("commonjs").unwrap());
        assert!(!map.get("shared-node-browser").unwrap());
        assert!(!map.get("es6").unwrap());
        assert!(!map.get("amd").unwrap());
        assert!(!map.get("mocha").unwrap());
        assert!(!map.get("jasmine").unwrap());
        assert!(!map.get("jest").unwrap());
        assert!(!map.get("phantomjs").unwrap());
        assert!(!map.get("protractor").unwrap());
        assert!(!map.get("qunit").unwrap());
        assert!(!map.get("jquery").unwrap());
        assert!(!map.get("prototypejs").unwrap());
        assert!(!map.get("shelljs").unwrap());
        assert!(!map.get("meteor").unwrap());
        assert!(!map.get("mongo").unwrap());
        assert!(!map.get("applescript").unwrap());
        assert!(!map.get("nashorn").unwrap());
        assert!(!map.get("serviceworker").unwrap());
        assert!(!map.get("atomtest").unwrap());
        assert!(!map.get("embertest").unwrap());
        assert!(!map.get("webextensions").unwrap());
        assert!(!map.get("greasemonkey").unwrap());
    }
}
