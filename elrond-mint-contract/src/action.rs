use elrond_wasm::{Address, BigUintApi, BoxedBytes};
derive_imports!();

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
