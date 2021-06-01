import { Transaction } from '@elrondnetwork/erdjs';
import { Socket } from 'socket.io-client';
import { ChainEmitter, ChainListener, ScCallEvent, TransferEvent, UnfreezeEvent } from '../chain_handler';
export declare class ElrondHelper implements ChainListener<TransferEvent | ScCallEvent>, ChainEmitter<string, void, UnfreezeEvent> {
    private readonly provider;
    private readonly sender;
    private readonly signer;
    private readonly mintContract;
    private readonly eventSocket;
    private constructor();
    eventIter(cb: (event: string) => Promise<void>): Promise<void>;
    static new: (node_uri: string, secret_key: string, sender: string, minter: string, socket: Socket) => Promise<ElrondHelper>;
    eventHandler(id: string): Promise<UnfreezeEvent>;
    emittedEventHandler(event: TransferEvent | ScCallEvent): Promise<void>;
    private transferMintVerify;
    private unfreezeEventHandler;
    scCallVerify({ action_id, to, value, endpoint, args }: ScCallEvent): Promise<Transaction>;
}
