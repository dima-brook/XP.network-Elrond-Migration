import * as elrond from "@elrondnetwork/erdjs"
import { UserSecretKey } from "@elrondnetwork/erdjs";
import * as polkadot from '@polkadot/api';
import { ContractPromise } from '@polkadot/api-contract';
import { ElrondTokenIdent } from "./consts";
import * as freezer_abi from './freezer_abi.json';


async function verifyEmitMint(provider: elrond.ProxyProvider, sender: elrond.Account, signer: elrond.ISigner, to: string , value: number): Promise<elrond.Transaction> {
    const tx = new elrond.Transaction({
        receiver: new elrond.Address(to),
        nonce: sender.nonce,
        data: elrond.TransactionPayload
            .contractCall()
            .setFunction(new elrond.ContractFunction("mint"))
            .addArg(new elrond.TokenIdentifierValue(Buffer.from(ElrondTokenIdent)))
            .addArg(new elrond.U32Value(value))
            .build()
    });

    signer.sign(tx);
    await tx.send(provider);

    return tx;
}

// TODO: Console args
const main = async () => {
    const polkaProvider = new polkadot.WsProvider("ws://127.0.0.1:9944");
    const polkaApi = await polkadot.ApiPromise.create({ provider: polkaProvider });

    const elrdProvider = new elrond.ProxyProvider("");
    await elrond.NetworkConfig.getDefault().sync(elrdProvider);
    const eMinterAddr = new elrond.Address("")
    const elrdMinter = new elrond.Account(eMinterAddr);
    const elrdSigner = new elrond.UserSigner(new UserSecretKey(Buffer.from("todo"))); // TODO
    await elrdMinter.sync(elrdProvider);

    const freezer = new ContractPromise(polkaApi, freezer_abi, "5ELGpadREtMnZvf1cP3V8wiENs8htZaRepFuaAQi8PY7cUcd");

    polkaApi.query.system.events((events) => {
        events.forEach(({event}) => {
			// Not a contract event
            if (event.method != 'ContractEmitted') {
				return;
            }
            console.log(`event data: ${event.data[0]}`);
			// Not our contract
			if (event.data[0].toString() != "5ELGpadREtMnZvf1cP3V8wiENs8htZaRepFuaAQi8PY7cUcd") {
				return;
			}

            const ev = freezer.abi.decodeEvent(event.data[1].toU8a());
			// TODO: Fix decoding
            const cev = event.data[1].toJSON();
            console.log(ev);
            console.log(cev);

            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore: Object is possibly 'null'.
			verifyEmitMint(elrdProvider, elrdMinter, elrdSigner, cev["to"], cev["value"]);
        });
    });
}

main()
