export type TransferEvent =  {
    readonly to: string,
    readonly value: BigInt,
    readonly read_cnt: number
}

export type ServerEvents = {
    // eslint-disable-next-line functional/no-return-void
    readonly "elrond:transfer_event": (id: string) => void;
};

export type ClientEvents = {
    // eslint-disable-next-line functional/no-return-void
    readonly "dummy": () => void;
};