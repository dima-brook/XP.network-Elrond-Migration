import { EventRecord } from '@polkadot/types/interfaces';
import { ChainEmitter, ChainListener, ScCallEvent, TransferEvent, UnfreezeEvent } from '../chain_handler';
import { ConcreteJson } from '../types';
export declare class PolkadotHelper implements ChainEmitter<EventRecord, void, TransferEvent | ScCallEvent>, ChainListener<UnfreezeEvent> {
    private readonly api;
    private readonly freezer;
    private readonly alice;
    private constructor();
    eventIter(cb: ((event: EventRecord) => Promise<void>)): Promise<void>;
    static new: (node_uri: string, freezer_abi: ConcreteJson, contract_addr: string) => Promise<PolkadotHelper>;
    private subscribe;
    eventHandler(ev: EventRecord): Promise<TransferEvent | ScCallEvent | undefined>;
    emittedEventHandler(event: UnfreezeEvent): Promise<void>;
    private unfreeze;
}
