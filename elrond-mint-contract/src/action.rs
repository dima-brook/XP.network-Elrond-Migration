
use elrond_wasm::{
	api::{BigUintApi, EndpointFinishApi, SendApi},
	io::EndpointResult,
	types::{Address, BoxedBytes, OptionalResult, SendToken},
};

elrond_wasm::derive_imports!();

#[derive(Clone, NestedEncode, NestedDecode, TopEncode, TopDecode, TypeAbi)]
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
#[derive(TypeAbi)]
pub enum PerformActionResult<SA>
where
	SA: SendApi + 'static,
{
	Nothing,
	SendXP(SendToken<SA>),
}

impl<SA> EndpointResult for PerformActionResult<SA>
where
	SA: SendApi + Clone + 'static,
{
	type DecodeAs = OptionalResult<Address>;

	fn finish<FA>(&self, api: FA)
	where
		FA: EndpointFinishApi + Clone + 'static,
	{
		match self {
			PerformActionResult::Nothing => (),
			PerformActionResult::SendXP(send_token) => send_token.finish(api),
		}
	}
}