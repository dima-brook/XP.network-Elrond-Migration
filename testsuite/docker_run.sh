#!/bin/bash

cur=$PWD

echo "Starting alice's substrate node(use ws port 9944 to access)"

(&>/dev/null ~/node-template --chain local --base-path /tmp/alice --port 30333 --ws-port 9944 --rpc-port 9933 --node-key 0000000000000000000000000000000000000000000000000000000000000001 --validator --ws-external &)

echo "Starting bob's substrate node(use ws port 9945 to access)"

(&>/dev/null ~/node-template --chain local --base-path /tmp/bob --port 30334 --ws-port 9945 --rpc-port 9934 --validator --ws-external &)

sleep 10

echo "Starting elrond test node"

cd ~/app/elrond-mint-contract
erdpy testnet clean
erdpy testnet config
(&>/dev/null erdpy testnet start &)
cd $cur

sleep 15

while [ `curl -s -o /dev/null -w "%{http_code}" localhost:7950/network/config` != "200" ]; do
	sleep 5
done

echo "Starting event middleware"

cd ../elrond-event-middleware
yarn run dev &
cd $cur
sleep 10

echo "starting substrate frontend"
cd ~/substrate-front-end-template
export PORT=8001
export BROWSER=NONE
export HOST=0.0.0.0
(&>/dev/null yarn start &)
cd $cur
sleep 30

python3.9 main.py
