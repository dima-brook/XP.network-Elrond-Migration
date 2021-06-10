#!/bin/bash

cur=$PWD

echo "Starting substrate node"

(&>/dev/null ~/node-template --dev --tmp --ws-external &)

sleep 10

echo "Starting elrond test node"

cd ~/app/elrond-mint-contract
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
