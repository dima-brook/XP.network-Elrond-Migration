fn main() {
	elrond_wasm_debug::abi_json::print_abi::<elrond_mint_contract::AbiProvider>();
}

// erdpy --verbose contract call erd1qqqqqqqqqqqqqpgq5hj37jkmfmv8l4tu2szwl3azsksmn5gsd8sstwgrpg --gas-limit 80000000 --function="deposit" --value 500000000000000000 --proxy="http://127.0.0.1:7950" --recall-nonce --send --pem="wallets/users/alice.pem"