import {
    Account,
    Address,
    AddressValue,
    ContractFunction,
    ISigner,
    NetworkConfig,
    ProxyProvider,
    Transaction,
    TransactionPayload,
    U32Value,
    UserSecretKey,
    UserSigner,
} from '@elrondnetwork/erdjs';

export type ElrondHelper = {
    readonly provider: ProxyProvider;
    readonly sender: Account;
    readonly signer: ISigner;
    readonly mintContract: Address;
};

export async function newHelper(
    node_uri: string,
    secret_key: Buffer,
    sender: string,
    minter: string
): Promise<ElrondHelper> {
    const provider = new ProxyProvider(node_uri);
    await NetworkConfig.getDefault().sync(provider);
    const eMinterAddr = new Address(sender);
    const senderac = new Account(eMinterAddr);
    const signer = new UserSigner(new UserSecretKey(secret_key));
    await senderac.sync(provider);

    return {
        provider: provider,
        sender: senderac,
        signer: signer,
        mintContract: new Address(minter)
    };
}

export async function verifyEmitMint(
    helper: ElrondHelper,
    to: string,
    value: number
): Promise<Transaction> {
    const tx = new Transaction({
        receiver: helper.mintContract,
        nonce: helper.sender.nonce,
        // fn validate_send_xp(to: Address, amount: BigUint, #[var_args] opt_data: OptionalArg<BoxedBytes>,)
        data: TransactionPayload.contractCall()
            .setFunction(new ContractFunction('validateSendXp'))
            .addArg(new AddressValue(new Address(to)))
            .addArg(new U32Value(value))
            .build(),
    });

    helper.signer.sign(tx);
    await tx.send(helper.provider);

    return tx;
}
