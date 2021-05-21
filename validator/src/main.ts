import { DecodedEvent } from '@polkadot/api-contract/types';

import * as fs from 'fs';
import * as elrond from './elrond';
import * as freezer_abi from './freezer_abi.json';
import * as polkadot from './polkadot';
import config from './config'

const main = async () => {

    const private_key = await fs.promises.readFile(config.private_key);

    const polka = await polkadot.newHelper(
        config.xnode,
        freezer_abi,
        config.xp_freezer
    );
    const elrd = await elrond.newHelper(
        config.elrond_node,
        private_key,
        config.elrond_sender,
        config.elrond_minter
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
                config.xp_freezer
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
