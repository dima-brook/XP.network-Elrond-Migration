import { ApiPromise, Keyring, WsProvider } from '@polkadot/api';
import { ContractPromise } from '@polkadot/api-contract';
import { DecodedEvent } from '@polkadot/api-contract/types';
import { KeyringPair, KeyringPair$Json } from '@polkadot/keyring/types';
import { EventRecord } from '@polkadot/types/interfaces';
import { AnyJson } from '@polkadot/types/types';
import BigNumber from 'bignumber.js';

import * as aliceJ from '../alice.json';
import { ChainEmitter, ChainListener, ScCallEvent, TransferEvent, UnfreezeEvent } from '../chain_handler';
import { ConcreteJson } from '../types';


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

export class PolkadotHelper implements ChainEmitter<EventRecord, void, TransferEvent | ScCallEvent>, ChainListener<UnfreezeEvent> {
    private readonly api: ApiPromise;
    private readonly freezer: ContractPromise;
    private readonly alice: KeyringPair; // TODO: Switch to proper keyringpair

    private constructor(api: ApiPromise, freezer: ContractPromise, alice: KeyringPair) {
        this.api = api;
        this.freezer = freezer;
        this.alice = alice;
    }

    async eventIter(cb: ((event: EventRecord) => Promise<void>)): Promise<void> {
        this.api.query.system.events(async (events) => {
            events.forEach((event) => cb(event));
        });
    }

    public static new = async (node_uri: string, freezer_abi: ConcreteJson, contract_addr: string): Promise<PolkadotHelper> => {
        const provider = new WsProvider(node_uri);
        const api = await ApiPromise.create({ provider: provider });
        const freezer = new ContractPromise(api, freezer_abi, contract_addr);
    
        const keyring = new Keyring({});
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        //@ts-ignore
        const alice = keyring.addFromJson(aliceJ as KeyringPair$Json)
    
        alice.unlock("ahPQDcuGjPJDMe4");

        const helper = new PolkadotHelper(api, freezer, alice);
        await helper.subscribe();
    
        return helper;
    }

    private async subscribe() {
        await this.freezer.tx
        .subscribe({ value: 0, gasLimit: -1 })
        .signAndSend(this.alice, (result) => {
            console.log(`sub tx: ${result.status}`)
        });
    }

    async eventHandler(ev: EventRecord): Promise<TransferEvent | ScCallEvent | undefined> {
        const event = ev.event;
        // Not a contract event
        if (event.method != 'ContractEmitted') {
            return;
        }
        // Not our contract
        if (event.data[0].toString() != this.freezer.address.toString()) {
            return;
        }

        const cev: DecodedEvent = this.freezer.abi.decodeEvent(
            Buffer.from(event.data[1].toString().replace('0x', ''), 'hex')
        );
        switch(cev.event.identifier) {
            case "Transfer": {
                const action_id = new BigNumber(cev.args[0].toJSON() as string);
                const to = cev.args[1].toJSON() as string;
                const value = new BigNumber(cev.args[2].toJSON() as number);

                return new TransferEvent(action_id, to, value);
            }
            case "ScCall": {
                const action_id = new BigNumber(cev.args[0].toJSON() as string);
                const to = cev.args[1].toJSON() as string;
                const endpoint = cev.args[2].toJSON() as string;
                const args = cev.args[3].toJSON();

                return new ScCallEvent(action_id, to, new BigNumber(0), endpoint, scCallArgSanitize(args));

            }
            default:
                throw Error(`unhandled event: ${cev.event.identifier}`)
        }
    }

    async emittedEventHandler(event: UnfreezeEvent): Promise<void> {
        await this.unfreeze(event);
    }

    private async unfreeze(event: UnfreezeEvent): Promise<void> {
        console.log(`unfreeze! to: ${event.to}, value: ${event.value}`);
        await this.freezer.tx
            .pop({ value: 0, gasLimit: -1 }, event.id.toString(), event.to, event.value.toNumber())
            .signAndSend(this.alice, (result) => {
                console.log("pop tx:", result.status);
            });
    }
}