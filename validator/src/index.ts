import * as fs from 'fs';
import { io } from 'socket.io-client';

import { ElrondHelper, emitEvents, PolkadotHelper } from "validator";
import config from "./config"
import * as freezer_abi from "./freezer_abi.json"

const main = async () => {
    const private_key = await fs.promises.readFile(config.private_key, "utf-8");

    const polka = await PolkadotHelper.new(
        config.xnode,
        freezer_abi,
        config.xp_freezer
    );
    const elrd = await ElrondHelper.new(
        config.elrond_node,
        private_key,
        config.elrond_minter,
        io(config.elrond_ev_socket)
    );

    console.log('READY TO LISTEN EVENTS!');

    emitEvents(polka, elrd);
    emitEvents(elrd, polka);
};

main();
