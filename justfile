#!/usr/bin/env -S just --justfile

# Set shell configurations
set windows-shell := ["powershell"]
set shell := ["bash", "-cu"]

setup:
    cargo install cargo-binstall
    cargo binstall taplo-cli cargo-release cargo-insta cargo-deny -y
    
    pnpm install
    
    @echo '✅ Setup complete!'

ready:
  just fmt    
  # just lint 
  @echo '✅ All passed!'

fmt:
    cargo fmt --all -- --emit=files
    taplo fmt **/Cargo.toml
    pnpm format
    @echo '✅ Format complete!'

lint: 
    cargo clippy --workspace --all-targets -- --deny warnings
    pnpm lint
    @echo '✅ Lint complete!'