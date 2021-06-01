import BigNumber from "bignumber.js";
export declare class TransferEvent {
    readonly action_id: BigNumber;
    readonly to: string;
    readonly value: BigNumber;
    constructor(action_id: BigNumber, to: string, value: BigNumber);
}
export declare class UnfreezeEvent {
    readonly id: BigNumber;
    readonly to: string;
    readonly value: BigNumber;
    constructor(action_id: BigNumber, to: string, value: BigNumber);
}
export declare class ScCallEvent {
    readonly action_id: BigNumber;
    readonly to: string;
    readonly value: BigNumber;
    readonly endpoint: string;
    readonly args?: string[];
    constructor(action_id: BigNumber, to: string, value: BigNumber, endpoint: string, args?: string[]);
}
export interface ChainEmitter<EmissionEvent, Iter, SupportedEvents> {
    eventIter(cb: (event: EmissionEvent) => Promise<void>): Promise<Iter>;
    eventHandler(event: EmissionEvent): Promise<SupportedEvents | undefined>;
}
export declare function emitEvents<Event, Iter, Handlers>(emitter: ChainEmitter<Event, Iter, Handlers>, listener: ChainListener<Handlers>): Promise<void>;
export interface ChainListener<SupportedEvents> {
    emittedEventHandler(event: SupportedEvents): Promise<void>;
}
