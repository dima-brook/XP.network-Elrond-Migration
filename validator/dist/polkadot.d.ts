import { ApiPromise } from '@polkadot/api';
import { ContractPromise } from '@polkadot/api-contract';
import { KeyringPair } from '@polkadot/keyring/types';
import { ConcreteJson } from './types';
export declare type PolkadotHelper = {
    readonly api: ApiPromise;
    readonly freezer: ContractPromise;
    readonly alice: KeyringPair;
};
export declare function newHelper(node_uri: string, freezer_abi: ConcreteJson, contract_addr: string): Promise<PolkadotHelper>;
export declare function subscribe(helper: PolkadotHelper): Promise<void>;
export declare function pop(helper: PolkadotHelper, id: BigInt, to: string, value: BigInt): Promise<void>;
