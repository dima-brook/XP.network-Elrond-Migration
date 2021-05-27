use elrond_wasm::{String, api::BigUintApi};

elrond_wasm::derive_imports!();

#[derive(TopEncode, TopDecode, TypeAbi, Clone)]
pub struct TransferEvent<BigUint: BigUintApi> {
    pub to: String,
    pub value: BigUint,
    pub read_cnt: usize
}

impl<BigUint: BigUintApi> TransferEvent<BigUint> {
    pub fn new(to: String, value: BigUint) -> Self {
        Self {
            to,
            value,
            read_cnt: 0
        }
    }
}