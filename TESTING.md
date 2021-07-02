# Testing

A whole testing app has been made for testing this bridge.
See the testsuite folder

## Testsuite Configuration

The `testsuite/config.ini` file is already setup for the docker test environment.

You can test it on a live testnet as well.

Change the `NODE_URI` in the `[ELROND]` section to `https://testnet-beta-api.elrond.com`  
Note that the default `SENDER_PEM` is a public wallet.

## Docker Test Environment

WARN: the current Dockerfile is not up-to-date for bridge-test-ui, checkout to `001fccfa11d7fd100916410520cd2a3b0ec085c8` for command line based test utility

WARN: The current docker image uses a local copy of erdpy due to testnet issues.
We are investigating the issue with the remote distribution.

### Building

This process may take from 20 to 40 minutes depending on your machine.

`docker build -t xpnet-elrond/test .`

### Testing

`docker run -p 8000:8001 -p 9944:9944 -p 7950:7950 -i -t --rm xpnet-elrond/test bash`

`./docker_run.sh`

substrate frontend should be accesible on `localhost:8000`!

### Troubleshooting

if `docker_run.sh` is stuck on "Starting elrond test node", consider cleaning the elrond testnet.

```shell
cd ../elrond-mint-contract
erdpy testnet clean && erdpy testnet config
cd ../testsuite
./docker_run.sh
```

## Manual Testing with testsuite

### Prerequisites

- [substrate](https://substrate.dev/docs/en/knowledgebase/getting-started/)
- [ink-cli](https://substrate.dev/substrate-contracts-workshop/#/0/setup)
- [elrond environment](https://docs.elrond.com/sdk-and-tools/erdpy/installing-erdpy/)
- [node.js](https://nodejs.org/en/)
- [yarn](https://yarnpkg.com/getting-started/install)
- [python-3.9](https://www.python.org/downloads/)

### Substrate Setup
- Run a local substrate node supporting contracts pallet (Our [substrate node](https://github.com/xp-network/vm_hub_pallet/tree/main) for example!): `./target/release/node-template --dev`

### Elrond Setup
- Run a local node & proxy (or use elrond's public testnet proxy)

#### Event Middleware
- Since proper event emission for contracts in elrond hasn't been added, you must start our [Elrond Event Middleware](./elrond-event-middleware) with

```
yarn install
yarn run dev
```

### Validator Setup
- `yarn install`

### Bridge-UI setup

Bridge UI is available [here](https://github.com/xp-network/bridge-test-ui/)
You must use a server ([VSCode Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer), nginx, etc) to serve the static files

### Running

Using `venv` is recommended.

- go to `testsuite`
- `pip3.9 install -r requirements.txt`
- `uvicorn main:app`

Bridge-UI is usable at this point

You can also run a local substrate-front-end in case balance is not visible on [polkadot.js.org](polkadot.js.org): https://github.com/substrate-developer-hub/substrate-front-end-template
