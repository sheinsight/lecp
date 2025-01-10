use lint::environments::Environments;

mod environments;

fn main() {
    let env = Environments::Es2016 | Environments::Es2017;
    println!("{:#?}", &env.to_hash_map());
}
