import { ApiPromise, WsProvider } from '@polkadot/api';
import { ContractPromise } from '@polkadot/api-contract';
import * as freezer_abi from './freezer_abi.json';


async function verifyEmit(to: string , value: number) {
    // TODO: Connect with Elrond Go Metachain Emitter
    console.log("unimplemented!");
    process.exit(-1);
}

// TODO: Console args
const main = async () => {
    const wsProvider = new WsProvider("ws://127.0.0.1:9944");
    const api = await ApiPromise.create({ provider: wsProvider });

    const freezer = new ContractPromise(api, freezer_abi, "5ELGpadREtMnZvf1cP3V8wiENs8htZaRepFuaAQi8PY7cUcd");

    api.query.system.events((events) => {
        events.forEach(({event}) => {
			// Not a contract event
            if (event.method != 'ContractEmitted') {
				return;	
            }
			// Not our contract
			if (event.data[0] != "5ELGpadREtMnZvf1cP3V8wiENs8htZaRepFuaAQi8PY7cUcd") {
				return;
			}

			// TODO: Fix decoding
			const cev = freezer.abi.decodeEvent(event.data[1].toU8a());
			verifyEmit(cev.to, cev.value);
        });
    });
}

main()
