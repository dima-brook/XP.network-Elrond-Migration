import { DecodedEvent } from '@polkadot/api-contract/types';
import * as yargs from 'yargs';

import * as elrond from './elrond';
import * as freezer_abi from './freezer_abi.json';
import * as polkadot from './polkadot';

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
            description: 'hex encoded validator private key',
        },
        sender: {
            alias: 's',
            demandOption: true,
            type: 'string',
            description: 'elrond sender address',
        },
        minter: {
            alias: 'm',
            demandOption: true,
            type: 'string',
            description: 'elrond minter contract address',
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
        Buffer.from(args.privk, "hex"),
        args.sender,
        args.minter
    );

    console.log("READY TO LISTEN EVENTS!");

    polka.api.query.system.events((events) => {
        events.forEach(({ event }) => {
            // Not a contract event
            if (event.method != 'ContractEmitted') {
                return;
            }
            // Not our contract
            if (
                event.data[0].toString() !=
                args.freezer
            ) {
                return;
            }

            const cev: DecodedEvent = polka.freezer.abi.decodeEvent(Buffer.from(event.data[1].toString().replace('0x', ''), "hex"))
            const to = cev.args[0].toJSON() as string;
            const value = cev.args[1].toJSON() as number;

            elrond.verifyEmitMint(elrd, to, value);
        });
    });
};

main();
