pub enum Rules {
    // correctness
    ForDirection,
}

pub trait Rule {
    fn name(&self) -> String;

    fn config(&self) -> String;
}
