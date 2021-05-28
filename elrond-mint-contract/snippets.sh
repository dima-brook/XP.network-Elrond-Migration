#!/bin/bash
PROXY="http://localhost:7950"
ALICE="./wallets/users/alice.pem"
ALICE_ADDR="0x0139472eff6886771a982f3083da5d421f24c29181e63888228dc81ca60d69e1"
DEPLOY_TRANSACTION=$(erdpy data load --key=deployTransaction-devnet)
# XPDT-{random string} in hex
DEPLOY_ARGUMENTS="0x585044542D653937653732 1 ${ALICE_ADDR}"
DEPLOY_GAS="800000000"

deploy() {
    erdpy --verbose contract deploy --bytecode=./wasm/target/wasm32-unknown-unknown/release/elrond_mint_contract_wasm.wasm --recall-nonce --pem=${ALICE} \
          --proxy=${PROXY} \
          --gas-limit=${DEPLOY_GAS} --arguments ${DEPLOY_ARGUMENTS} \
          --send || return

#     erdpy --verbose contract call ${ADDRESS} --recall-nonce --pem=${ALICE} \
#          --proxy=${PROXY} \
#         --gas-limit=${DEPLOY_GAS} --function="deposit" --value 500000000000000000 \
#         --send
}


$@