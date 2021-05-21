
use elrond_wasm::{
	api::BigUintApi,
	types::{Address, BoxedBytes},
};

elrond_wasm::derive_imports!();

#[derive(NestedEncode, NestedDecode, TopEncode, TopDecode, TypeAbi)]
pub enum Action<BigUint: BigUintApi> {
	Nothing,
	AddValidator(Address),
	RemoveUser(Address),
	ChangeMinValid(usize),
	SendXP {
		to: Address,
		amount: BigUint,
		data: BoxedBytes,
	},
}
