use anyhow::Result;
use lecp_bundless::bundless_js;

fn main() -> Result<()> {
    miette::set_hook(Box::new(|_| {
        Box::new(
            miette::MietteHandlerOpts::new().color(true).unicode(true).terminal_links(true).build(),
        )
    }))?;

    env_logger::init();

    let start_time = std::time::Instant::now();
    let cwd = std::env::current_dir()?.join("./examples/demo-component").canonicalize()?;
    bundless_js(&cwd)?;

    let end_time = std::time::Instant::now();
    println!("Transforming files took: {} ms", (end_time - start_time).as_millis());

    Ok(())
}

// webpack define 格式转换成 swc `jsc.transform.optimizer.globals` 配置
// fn get_globals_form_define(define: HashMap<String, String>) {
//     // typeof -> globals.typeofs
//     // vars -> globals.vars
// }
