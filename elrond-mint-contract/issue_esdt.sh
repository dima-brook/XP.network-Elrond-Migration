#!/bin/bash
 
erdpy tx new --proxy="http://127.0.0.1:7950" \
    --pem="./wallets/users/alice.pem" \
    --data="issue@58504454@58504454@03E8@06@63616E4D696E74@74727565@63616E4275726E@74727565@63616E4368616E67654F776E6572@74727565" \
    --receiver erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqzllls8a5w6u --gas-limit 800000000 --recall-nonce  --value 5000000000000000000 --send