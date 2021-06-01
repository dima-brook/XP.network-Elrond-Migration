import { Account, Address, ISigner, ProxyProvider, Transaction } from '@elrondnetwork/erdjs';
import { Socket } from 'socket.io-client';
import { BigNumber } from 'bignumber.js';
export declare type ElrondHelper = {
    readonly provider: ProxyProvider;
    readonly sender: Account;
    readonly signer: ISigner;
    readonly mintContract: Address;
    readonly eventSocket: Socket;
};
export declare function newHelper(node_uri: string, secret_key: string, sender: string, minter: string, socket: Socket): Promise<ElrondHelper>;
export declare function getDepositEvent(helper: ElrondHelper, id: string): Promise<[string, BigInt]>;
export declare function verifyEmitMint(helper: ElrondHelper, action_id: BigNumber, to: string, value: number): Promise<Transaction>;
export declare function verifyEmitScCall(helper: ElrondHelper, value: number, action_id: BigNumber, target: string, endpoint: string, args?: string[]): Promise<Transaction>;
