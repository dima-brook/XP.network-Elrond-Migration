import * as elrond from '../elrond';
import * as polkadot from '../polkadot';
import * as polkaT from '@polkadot/api-contract/types';
import BigNumber from 'bignumber.js';
import { AnyJson } from '@polkadot/types/types';

export async function elrondTransferEventHandler(elrd: elrond.ElrondHelper, polka: polkadot.PolkadotHelper, id: string): Promise<void> {
    console.log(`received event ${id}`);
    const ev_info = await elrond.getDepositEvent(elrd, id);
    await polkadot.pop(polka, BigInt(id), ev_info[0], ev_info[1]);
}


export async function polkaTransferEventHandler(_polka: polkadot.PolkadotHelper, elrd: elrond.ElrondHelper, event: polkaT.DecodedEvent): Promise<void> {
    const action_id = new BigNumber(event.args[0].toJSON() as string);
    const to = event.args[1].toJSON() as string;
    const value = event.args[2].toJSON() as number;

    console.log(`action_id: ${action_id}`);
    console.log(`to: ${to}`);
    console.log(`value: ${value}`);

    const tx = await elrond.verifyEmitMint(elrd, action_id, to, value);
    console.log(`Hash: ${tx.getHash().toString()}`);
}

type AnyJsonE = string | boolean | number;

function sanitizeInner(arg: AnyJsonE): string {
    if (typeof arg == "string") {
        return arg.replace('0x', '')
    } else if (typeof arg == "number") {
        return (arg % 2 ? '0' : '') + arg.toString(16)
    } else if (typeof arg == "boolean") {
        return arg ? '01' : '00'
    } else {
        return ""; // unreachable
    }
}

function scCallArgSanitize(arg: AnyJson): string[] | undefined {
    if (typeof arg == "string" || typeof arg == "boolean" || typeof arg == "number") {
        return Array.of(sanitizeInner(arg))
    } else if (!arg) {
        return undefined;
    } else {
        return (arg as AnyJson[]).map((v) => sanitizeInner(v as AnyJsonE));
    }
}

export async function polkaScCallEventHandler(_polka: polkadot.PolkadotHelper, elrd: elrond.ElrondHelper, event: polkaT.DecodedEvent): Promise<void> {
    const action_id = new BigNumber(event.args[0].toJSON() as string);
    const to = event.args[1].toJSON() as string;
    const endpoint = event.args[2].toJSON() as string;
    const args = event.args[3].toJSON();
    const tx = await elrond.verifyEmitScCall(elrd, 0, action_id, to, endpoint, scCallArgSanitize(args))
    console.log(`Hash: ${tx.getHash().toString()}`)
}