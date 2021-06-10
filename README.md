# XP-Elrond Migrations

See Freezer for a WIP coin freezer ink contract \
See Validator for a WIP txn mediator \
See elrond-mint-contract for a WIP elrond multisig based wrapper token minter

This repository has submodules.
remember to clone with the `--recursive` flag!

# Docker Test Environment

## Building

This process may take from 20 to 40 minutes depending on your machine.

`docker build -t xpnet-elrond/test .`

## Testing

`docker run -p 8000:8001 -p 9944:9944 -p 7950:7950 -i -t --rm xpnet-elrond/test bash`

`./docker_run.sh`

substrate frontend should be accesible on `localhost:8000`!

## Troubleshooting

if `docker_run.sh` is stuck on "Starting elrond test node", consider cleaning the elrond testnet.

```shell
cd ../elrond-mint-contract
erdpy testnet clean && erdpy testnet config
cd ../testsuite
./docker_run.sh
```

# Prerequisites

- [ink-cli](https://substrate.dev/substrate-contracts-workshop/#/0/setup)
- [elrond environment](https://docs.elrond.com/developers/tutorials/counter/)

# Test Usage

## Substrate Setup
- Run a local substrate node supporting contracts pallet (Our [substrate node](https://github.com/xp-network/vm_hub_pallet/tree/main) for example!): `./target/release/node-template --dev`
- Compile the freezer contract: `cargo +nightly contract build`
- Deploy the contract on local substrate chain via [polkadot.js/apps](https://polkadot.js.org/apps/#/contracts)

## Elrond Setup
- Run a local node & proxy(optionally a testnet too)
- Deploy an ESDT token via erdpy (This will be a wrapper token): [here](https://docs.elrond.com/developers/esdt-tokens/)
- Update snippets.sh DEPLOY_ARGUMENTS accordingly
- Deploy the contract with `./snippets.sh deploy`
- Deposit a minute amount of EGLD to the smart contract

## Validator setup
- Setup `validators/src/config.ts`
- Start the validator `npm run dev`


- Send some coins to freezer contract with a target elrond address
- The target elrond address should receive our wrapper tokens within seconds

# Limitations

Only one way(XP -> ELROND) transactions are implemented for now
