import { ApiPromise, Keyring, WsProvider } from '@polkadot/api';
import { ContractPromise } from '@polkadot/api-contract';
import { KeyringPair } from '@polkadot/keyring/types';

import { ConcreteJson } from './types';

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

    const keyring = new Keyring();
    

    let ret = {
        api: api,
        freezer: freezer,
        alice: keyring.addFromUri("//Alice")
    };

    console.log(`alice addr: ${ret.alice.address}`);

    await subscribe(ret).catch(() => {});

    return ret;
}

export async function subscribe(helper: PolkadotHelper): Promise<void> {
    await helper.freezer.tx
        .subscribe({ value: 0, gasLimit: -1 })
        .signAndSend(helper.alice, (result) => {
            console.log(`sub tx: ${result.status.hash}`)
        });
}

export async function pop(helper: PolkadotHelper, id: BigInt, to: string, value: BigInt): Promise<void> {
    await helper.freezer.tx
        .pop({ value: 0, gasLimit: -1 }, id.toString(), to, value)
        .signAndSend(helper.alice, (result) => {
            console.log(`pop tx: ${result.status.hash}`);
        });
}