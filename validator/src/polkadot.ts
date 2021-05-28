import { ApiPromise, Keyring, WsProvider } from '@polkadot/api';
import { ContractPromise } from '@polkadot/api-contract';
import { KeyringPair, KeyringPair$Json } from '@polkadot/keyring/types';

import { ConcreteJson } from './types';

import * as alice from './alice.json';

export type PolkadotHelper = {
    readonly api: ApiPromise;
    readonly freezer: ContractPromise;
    readonly alice: KeyringPair // TODO: Switch to proper keyringpair
};

export async function newHelper(
    node_uri: string,
    freezer_abi: ConcreteJson,
    contract_addr: string
): Promise<PolkadotHelper> {
    const provider = new WsProvider(node_uri);
    const api = await ApiPromise.create({ provider: provider });
    const freezer = new ContractPromise(api, freezer_abi, contract_addr);

    const keyring = new Keyring({});


    let ret = {
        api: api,
        freezer: freezer,
        //@ts-ignore
        alice: keyring.addFromJson(alice as KeyringPair$Json)
    };

    ret.alice.unlock("ahPQDcuGjPJDMe4");

    console.log(`alice addr: ${ret.alice.address}`);

    await subscribe(ret);

    return ret;
}

export async function subscribe(helper: PolkadotHelper): Promise<void> {
    await helper.freezer.tx
        .subscribe({ value: 0, gasLimit: -1 })
        .signAndSend(helper.alice, (result) => {
            console.log(`sub tx: ${result.status}`)
        });
}

export async function pop(helper: PolkadotHelper, id: BigInt, to: string, value: BigInt): Promise<void> {
    console.log(`to: ${to}, value: ${value}`);
    await helper.freezer.tx
        .pop({ value: 0, gasLimit: -1 }, id.toString(), to, parseInt(value.toString()))
        .signAndSend(helper.alice, (result) => {
            console.log("pop tx:", result.status);
        });
}