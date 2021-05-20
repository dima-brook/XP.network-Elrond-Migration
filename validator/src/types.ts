import { AnyJson } from '@polkadot/types/types';

export type ConcreteJson = {
    readonly [index: string]: AnyJson;
};
