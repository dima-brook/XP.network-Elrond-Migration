import { ApiPromise, Keyring, WsProvider } from '@polkadot/api';
import { ContractPromise } from '@polkadot/api-contract';
import { KeyringPair } from '@polkadot/keyring/types';

import { ConcreteJson } from './types';

export type PolkadotHelper = {
    readonly api: ApiPromise;
    readonly freezer: ContractPromise;
    readonly alice: KeyringPair
};

export async function newHelper(
    node_uri: string,
    freezer_abi: ConcreteJson,
    contract_addr: string
): Promise<PolkadotHelper> {
    const provider = new WsProvider(node_uri);
    const api = await ApiPromise.create({ provider: provider });
    const freezer = new ContractPromise(api, freezer_abi, contract_addr);

    const keyring = new Keyring({ type: 'sr25519', ss58Format: 2 });
    

    let ret = {
        api: api,
        freezer: freezer,
        alice: keyring.addFromUri("//Alice")
    };
    await subscribe(ret);

    return ret;
}

export async function subscribe(helper: PolkadotHelper): Promise<void> {
    await helper.freezer.tx
        .subscribe({ value: 0, gasLimit: -1 })
        .signAndSend(helper.alice, (result) => {
            console.log(`sub tx: ${result.status.hash}`)
        });
}

export async function pop(helper: PolkadotHelper, to: string, value: BigInt): Promise<void> {
    await helper.freezer.tx
        .pop({ value: 0, gasLimit: -1 }, 0, to, value)
        .signAndSend(helper.alice, (result) => {
            console.log(`pop tx: ${result.status.hash}`);
        });
}