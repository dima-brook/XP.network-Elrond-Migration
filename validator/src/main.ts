import { DecodedEvent } from '@polkadot/api-contract/types';

import { io } from 'socket.io-client';
import * as fs from 'fs';
import * as elrond from './elrond';
import * as freezer_abi from './freezer_abi.json';
import * as polkadot from './polkadot';
import config from './config';
import { polkaTransferEventHandler, elrondTransferEventHandler, polkaScCallEventHandler } from "./handlers/liquidity"

async function elrdEventListener(
    elrd: elrond.ElrondHelper,
    polka: polkadot.PolkadotHelper
): Promise<void> {
    elrd.eventSocket.on("elrond:transfer_event", async (id) => {
        await elrondTransferEventHandler(elrd, polka, id)
        .catch((e) => console.log("Invalid event emitted: ", e))
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
            switch(cev.event.identifier) {
                case "Transfer":
                    await polkaTransferEventHandler(polka, elrd, cev);
                    break;
                case "ScCall":
                    await polkaScCallEventHandler(polka, elrd, cev);
                    break;
                default:
                    console.log("WARN: unhandeled event: ", cev.event.identifier);
                    break;
            }
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
