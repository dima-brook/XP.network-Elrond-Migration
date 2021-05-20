use elrond_wasm_debug::*;
use elrond_mint_contract::*;

fn main() {
	let contract = MultisigImpl::new(TxContext::dummy());
	print!("{}", abi_json::contract_abi(&contract));
}
