
use elrond_wasm::{
	api::{BigUintApi, EndpointFinishApi, SendApi},
	io::EndpointResult,
	types::{Address, BoxedBytes, OptionalResult, SendToken, Vec},
};

elrond_wasm::derive_imports!();

/// Available actions that validators can call
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

// Information associated with an action
#[derive(TopEncode, TopDecode, TypeAbi)]
pub struct ActionInfo<BigUint: BigUintApi> {
	pub action: Action<BigUint>,
	pub signers: Vec<usize>,
	pub executed: bool,
	pub event_recv_cnt: usize
}

impl<BigUint: BigUintApi> ActionInfo<BigUint>{
	pub fn new(action: Action<BigUint>, signers: Vec<usize>, executed: bool, event_recv_cnt: usize) -> Self {
		Self {
			action,
			signers,
			executed,
			event_recv_cnt
		}
	}
}

/// Action Result
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