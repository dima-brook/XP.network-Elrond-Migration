import { Account, Address, ContractFunction, ISigner, NetworkConfig, ProxyProvider, TokenIdentifierValue, Transaction, TransactionPayload, U32Value, UserSecretKey, UserSigner } from "@elrondnetwork/erdjs";
import { ElrondTokenIdent } from "./consts";

export type ElrondHelper = {
     readonly provider: ProxyProvider,
     readonly sender: Account,
     readonly signer: ISigner
}

export async function newHelper(node_uri: string, secret_key: Buffer, sender: string): Promise<ElrondHelper> {
    const provider = new ProxyProvider(node_uri);
    await NetworkConfig.getDefault().sync(provider);
    const eMinterAddr = new Address(sender)
    const minter = new Account(eMinterAddr);
    const signer = new UserSigner(new UserSecretKey(secret_key)); // TODO
    await minter.sync(provider);

    return {
        provider: provider,
        sender: minter,
        signer: signer
    }
}

export async function verifyEmitMint(helper: ElrondHelper, to: string, value: number): Promise<Transaction> {
    const tx = new Transaction({
        receiver: new Address(to),
        nonce: helper.sender.nonce,
        data: TransactionPayload
            .contractCall()
            .setFunction(new ContractFunction("mint"))
            .addArg(new TokenIdentifierValue(Buffer.from(ElrondTokenIdent)))
            .addArg(new U32Value(value))
            .build()
    });

    helper.signer.sign(tx);
    await tx.send(helper.provider);

    return tx;
}