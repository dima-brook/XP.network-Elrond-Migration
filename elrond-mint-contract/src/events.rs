use elrond_wasm::{String, api::BigUintApi, types::{BoxedBytes, TokenIdentifier}};

elrond_wasm::derive_imports!();

#[derive(Clone, NestedEncode, NestedDecode, TopEncode, TopDecode, TypeAbi)]
pub enum Event<BigUint: BigUintApi> {
    Unfreeze {
        chain_nonce: u64,
        to: String,
        value: BigUint,
    },
    UnfreezeNft {
        chain_nonce: u64,
        to: String,
        id: BoxedBytes,
    },
    Transfer {
        chain_nonce: u64,
        to: String,
        value: BigUint
    },
    TransferNft {
        chain_nonce: u64,
        to: String,
        token: TokenIdentifier,
        nonce: u64
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
