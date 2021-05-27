export type TransferEvent =  {
    readonly to: string,
    readonly value: BigInt,
    readonly read_cnt: number
}

export type ServerEvents = {
    // eslint-disable-next-line functional/no-return-void
    readonly "elrond:emitted_event": (id: BigInt) => void;
};

export type ClientEvents = {
    // eslint-disable-next-line functional/no-return-void
    readonly "dummy": () => void;
};