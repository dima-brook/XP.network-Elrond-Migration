#!/bin/bash
ALICE="./wallets/users/alice.pem"
ALICE_ADDR="0x0139472eff6886771a982f3083da5d421f24c29181e63888228dc81ca60d69e1"
ADDRESS=$(erdpy data load --key=address-devnet)
DEPLOY_TRANSACTION=$(erdpy data load --key=deployTransaction-devnet)
# XPDT-abcdef in hex
DEPLOY_ARGUMENTS="0x585044542D616263646566 1 ${ALICE_ADDR}"
DEPLOY_GAS="800000000"

deploy() {
    erdpy --verbose contract deploy --project=. --recall-nonce --pem=${ALICE} \
          --gas-limit=${DEPLOY_GAS} --arguments ${DEPLOY_ARGUMENTS} \
          --outfile="deploy-devnet.interaction.json" --send || return

    TRANSACTION=$(erdpy data parse --file="deploy-devnet.interaction.json" --expression="data['emitted_tx']['hash']")
    ADDRESS=$(erdpy data parse --file="deploy-devnet.interaction.json" --expression="data['emitted_tx']['address']")

    erdpy data store --key=address-devnet --value=${ADDRESS}
    erdpy data store --key=deployTransaction-devnet --value=${TRANSACTION}

    echo ""
    echo "Smart contract address: ${ADDRESS}"
}


$@