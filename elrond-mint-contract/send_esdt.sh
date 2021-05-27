#!/bin/bash

erdpy --verbose contract call $1 --recall-nonce --pem=$2 \
        --proxy="http://127.0.0.1:7950" \
        --gas-limit=800000000 --function="deposit" --value 500000000000000000 \
        --send
