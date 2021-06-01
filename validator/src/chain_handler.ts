import BigNumber from "bignumber.js";

export class TransferEvent {
    readonly action_id: BigNumber;
    readonly to: string;
    readonly value: BigNumber;

    constructor(action_id: BigNumber, to: string, value: BigNumber) {
        this.action_id = action_id;
        this.to = to;
        this.value = value;
    }
}

export class UnfreezeEvent {
    readonly id: BigNumber;
    readonly to: string;
    readonly value: BigNumber;

    constructor(action_id: BigNumber, to: string, value: BigNumber) {
        this.id = action_id;
        this.to = to;
        this.value = value;
    }
}

export class ScCallEvent {
    readonly action_id: BigNumber;
    readonly to: string;
    readonly value: BigNumber;
    readonly endpoint: string;
    readonly args?: string[];

    constructor(action_id: BigNumber, to: string, value: BigNumber, endpoint: string, args?: string[]) {
        this.action_id = action_id;
        this.to = to;
        this.value = value;
        this.endpoint = endpoint;
        this.args = args;
    }
}

export interface ChainEmitter<EmissionEvent, Iter, SupportedEvents> {
   eventIter(cb: (event: EmissionEvent) => Promise<void>): Promise<Iter>;
   eventHandler(event: EmissionEvent): Promise<SupportedEvents | undefined>;
}

export async function emitEvents<Event, Iter, Handlers>(emitter: ChainEmitter<Event, Iter, Handlers>, listener: ChainListener<Handlers>): Promise<void> {
    emitter.eventIter(async (event) => {
        if (event == undefined) {
            return;
        }
        const ev = await emitter.eventHandler(event);
        ev !== undefined && await listener.emittedEventHandler(ev);
    })
}

export interface ChainListener<SupportedEvents> {
    emittedEventHandler(event: SupportedEvents): Promise<void>;
}