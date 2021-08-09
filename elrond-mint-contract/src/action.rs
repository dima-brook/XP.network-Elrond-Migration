use elrond_wasm::{api::{BigUintApi, EndpointFinishApi, SendApi}, io::EndpointResult, types::{Address, AsyncCall, BoxedBytes, OptionalResult, SendEgld, TokenIdentifier, Vec}};

elrond_wasm::derive_imports!();

/// Available actions that validators can call
#[derive(Clone, NestedEncode, NestedDecode, TopEncode, TopDecode, TypeAbi)]
pub enum Action<BigUint: BigUintApi> {
	Nothing,
	AddValidator(Address),
	RemoveUser(Address),
	ChangeMinValid(usize),
	SendWrapped {
        chain_nonce: u64,
		to: Address,
		amount: BigUint,
		data: BoxedBytes,
	},
	SendNft {
        chain_nonce: u64,
		to: Address,
		id: BoxedBytes,
	},
	Unfreeze {
		to: Address,
		amount: BigUint
	},
	UnfreezeNft {
		to: Address,
		token: TokenIdentifier,
		nonce: u64
	}
}

// Information associated with an action
#[derive(TopEncode, TopDecode, TypeAbi)]
pub struct ActionInfo<BigUint: BigUintApi> {
	pub action: Action<BigUint>,
	pub signers: Vec<usize>,
	pub event_recv_cnt: usize
}

impl<BigUint: BigUintApi> ActionInfo<BigUint>{
	pub fn new(action: Action<BigUint>, signers: Vec<usize>, event_recv_cnt: usize) -> Self {
		Self {
			action,
			signers,
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
	Done,
	Pending,
	AsyncCall(AsyncCall<SA>),
	Unfreeze(SendEgld<SA>)
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
			PerformActionResult::Done | PerformActionResult::Pending=> (),
			PerformActionResult::AsyncCall(async_call) => async_call.finish(api),
			PerformActionResult::Unfreeze(send_egld) => send_egld.finish(api)
		}
	}
}
