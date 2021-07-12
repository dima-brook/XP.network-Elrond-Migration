use elrond_wasm::{
    String,
	api::BigUintApi,
	types::{BoxedBytes, Vec},
};

elrond_wasm::derive_imports!();

#[derive(Clone, NestedEncode, NestedDecode, TopEncode, TopDecode, TypeAbi)]
pub enum Event<BigUint: BigUintApi> {
    Unfreeze {
        to: String,
        value: BigUint,
    },
    UnfreezeNft {
        to: String,
        id: BoxedBytes,
    },
    Rpc {
        to: String,
        value: BigUint,
        endpoint: String,
        args: Vec<BoxedBytes>,
    },
    Transfer {
        to: String,
        value: BigUint
    }
}

#[derive(TopEncode, TopDecode, TypeAbi, Clone)]
pub struct EventInfo<BigUint: BigUintApi> {
    pub event: Event<BigUint>,
    pub read_cnt: usize
}

impl<BigUint: BigUintApi> EventInfo<BigUint> {
    pub fn new(event: Event<BigUint>) -> Self {
        Self {
            event,
            read_cnt: 0
        }
    }
}