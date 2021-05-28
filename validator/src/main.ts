import { DecodedEvent } from '@polkadot/api-contract/types';

import { io } from 'socket.io-client';
import * as fs from 'fs';
import * as elrond from './elrond';
import * as freezer_abi from './freezer_abi.json';
import * as polkadot from './polkadot';
import config from './config';
import { decodeBigNumber } from '@elrondnetwork/erdjs/out';

async function elrdEventListener(
    elrd: elrond.ElrondHelper,
    polka: polkadot.PolkadotHelper
): Promise<void> {
    elrd.eventSocket.on("elrond:emitted_event", async (id) => {
        console.log(`received event ${id}`);
        const ev_info = await elrond.getDepositEvent(elrd, id);
        polkadot.pop(polka, id, ev_info[0], ev_info[1]).catch(() => {})
    })
}

async function polkaEventListener(
    polka: polkadot.PolkadotHelper,
    elrd: elrond.ElrondHelper
): Promise<void> {
    polka.api.query.system.events((events) => {
        events.forEach(async ({ event }) => {
            // Not a contract event
            if (event.method != 'ContractEmitted') {
                return;
            }
            // Not our contract
            if (event.data[0].toString() != config.xp_freezer) {
                return;
            }

            const cev: DecodedEvent = polka.freezer.abi.decodeEvent(
                Buffer.from(event.data[1].toString().replace('0x', ''), 'hex')
            );
            const action_id = Buffer.from(cev.args[0].toHex(), 'hex');
            const to = cev.args[1].toJSON() as string;
            const value = cev.args[2].toJSON() as number;

            console.log(`action_id: ${decodeBigNumber(action_id)}`);
            console.log(`to: ${to}`);
            console.log(`value: ${value}`);

            const tx = await elrond.verifyEmitMint(elrd, action_id, to, value);
            console.log(`Hash: ${tx.getHash().toString()}`);
        });
    });
}

const main = async () => {
    const private_key = await fs.promises.readFile(config.private_key, "utf-8");

    const polka = await polkadot.newHelper(
        config.xnode,
        freezer_abi,
        config.xp_freezer
    );
    const elrd = await elrond.newHelper(
        config.elrond_node,
        private_key,
        config.elrond_sender,
        config.elrond_minter,
        io(config.elrond_ev_socket)
    );

    console.log('READY TO LISTEN EVENTS!');

    polkaEventListener(polka, elrd);
    elrdEventListener(elrd, polka);
};

main();
