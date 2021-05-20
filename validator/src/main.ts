import * as yargs from 'yargs';

import * as elrond from './elrond';
import * as freezer_abi from './freezer_abi.json';
import * as polkadot from './polkadot';
import { ConcreteJson } from './types';

const main = async () => {
    const args = yargs.options({
        xnode: {
            alias: 'x',
            demandOption: true,
            type: 'string',
            description: 'xp node uri',
        },
        enode: {
            alias: 'e',
            demandOption: true,
            type: 'string',
            description: 'elrond node uri',
        },
        privk: {
            alias: 'p',
            demandOption: true,
            type: 'string',
            description: 'validator private key',
        },
        sender: {
            alias: 's',
            demandOption: true,
            type: 'string',
            description: 'elrond sender address',
        },
        freezer: {
            alias: 'f',
            demandOption: true,
            type: 'string',
            description: 'xp chain freezer contract address',
        },
    }).argv;

    const polka = await polkadot.newHelper(
        args.xnode,
        freezer_abi,
        args.freezer
    );
    const elrd = await elrond.newHelper(
        args.enode,
        Buffer.from(args.privk),
        args.sender
    );

    polka.api.query.system.events((events) => {
        events.forEach(({ event }) => {
            // Not a contract event
            if (event.method != 'ContractEmitted') {
                return;
            }
            console.log(`event data: ${event.data[0]}`);
            // Not our contract
            if (
                event.data[0].toString() !=
                '5ELGpadREtMnZvf1cP3V8wiENs8htZaRepFuaAQi8PY7cUcd'
            ) {
                return;
            }

            const ev = polka.freezer.abi.decodeEvent(event.data[1].toU8a());
            // TODO: Fix decoding
            const cev: ConcreteJson = event.data[1].toJSON() as ConcreteJson;
            const to: string = cev['to'] as string;
            const value: number = cev['value'] as number;
            console.log(ev);
            console.log(cev);

            elrond.verifyEmitMint(elrd, to, value);
        });
    });
};

main();
