import { ApiPromise, WsProvider } from '@polkadot/api';
import { ContractPromise } from '@polkadot/api-contract';
import { Event } from '@polkadot/types/interfaces';

import { ConcreteJson } from './types';

export type PolkadotHelper = {
    readonly api: ApiPromise,
    readonly freezer: ContractPromise,
}

export async function newHelper(node_uri: string, freezer_abi: ConcreteJson, contract_addr: string): Promise<PolkadotHelper> {
    const provider = new WsProvider(node_uri);
    const api = await ApiPromise.create({ provider: provider });
    const freezer = new ContractPromise(api, freezer_abi, contract_addr);

    return {
        api: api,
        freezer: freezer
    }
}