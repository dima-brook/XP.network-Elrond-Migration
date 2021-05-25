use elrond_wasm::{String, api::BigUintApi};

elrond_wasm::derive_imports!();

#[derive(TopEncode, TopDecode, TypeAbi)]
struct TransferEvent<BigUint: BigUintApi> {
    action_id: String,
    to: String,
    value: BigUint
}