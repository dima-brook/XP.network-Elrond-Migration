#!/bin/bash

ADDR=$(erdpy wallet bech32 --decode $2)

erdpy tx new --pem="./wallets/users/alice.pem" \
    --data="setSpecialRole@$1@${ADDR}@45534454526F6C654C6F63616C4D696E74" \
    --recall-nonce --receiver=erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqzllls8a5w6u \
    --gas-limit=500000000 --send

erdpy tx new --pem="./wallets/users/alice.pem" \
    --data="setSpecialRole@$1@${ADDR}@45534454526F6C654C6F63616C4275726E" \
    --recall-nonce --receiver=erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqzllls8a5w6u \
    --gas-limit=500000000 --send