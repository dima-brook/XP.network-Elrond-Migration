#!/bin/bash

PROXY="http://localhost:7950"
ADDR=$(erdpy wallet bech32 --decode $2)

erdpy tx new --pem="./wallets/users/alice.pem" \
    --proxy=${PROXY} \
    --data="setSpecialRole@$1@${ADDR}@45534454526F6C654C6F63616C4D696E74@45534454526F6C654C6F63616C4275726E" \
    --recall-nonce --receiver=erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqzllls8a5w6u \
    --gas-limit=500000000 --value 0 --send