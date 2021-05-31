import {
    Account,
    Address,
    AddressValue,
    Balance,
    BigUIntType,
    BigUIntValue,
    BinaryCodec,
    BytesValue,
    ContractFunction,
    //decodeString,
    GasLimit,
    ISigner,
    ListType,
    NetworkConfig,
    parseUserKey,
    ProxyProvider,
    StructFieldDefinition,
    StructType,
    Transaction,
    TransactionPayload,
    U32Value,
    U8Type,
    UserSigner,
} from '@elrondnetwork/erdjs';
import { Socket } from 'socket.io-client';
import { BigNumber } from 'bignumber.js';


export type ElrondHelper = {
    readonly provider: ProxyProvider;
    readonly sender: Account;
    readonly signer: ISigner;
    readonly mintContract: Address;
    readonly eventSocket: Socket
};

export async function newHelper(
    node_uri: string,
    secret_key: string,
    sender: string,
    minter: string,
    socket: Socket
): Promise<ElrondHelper> {
    const provider = new ProxyProvider(node_uri);
    await NetworkConfig.getDefault().sync(provider);
    const eMinterAddr = new Address(sender);
    const senderac = new Account(eMinterAddr);
    const signer = new UserSigner(parseUserKey(secret_key));

    return {
        provider: provider,
        sender: senderac,
        signer: signer,
        mintContract: new Address(minter),
        eventSocket: socket
    };
}

const transfer_event_t = new StructType("TransferEvent", [
    new StructFieldDefinition("to", "", new ListType(new U8Type())),
    new StructFieldDefinition("value", "", new BigUIntType())
])

export async function getDepositEvent(
    helper: ElrondHelper,
    id: string
): Promise<[string, BigInt]> {
    await helper.sender.sync(helper.provider);

    const tx = new Transaction({
        receiver: helper.mintContract,
        nonce: helper.sender.nonce,
        gasLimit: new GasLimit(50000000),
        data: TransactionPayload.contractCall()
            .setFunction(new ContractFunction("eventRead"))
            .addArg(new BigUIntValue(new BigNumber(id)))
            .build(),
    });

    helper.signer.sign(tx);
    await tx.send(helper.provider);

    await tx.awaitNotarized(helper.provider);
    console.log(`tx hash: ${tx.getHash().toString()}`)
    const res =  (await tx.getAsOnNetwork(helper.provider)).getSmartContractResults();
    const data = res.getImmediate().outputUntyped();
    const decoder = new BinaryCodec();
    const fin = decoder.decodeTopLevel(data[0], transfer_event_t).valueOf();

    return [Buffer.from((fin["to"])).toString(), fin["value"] as BigInt];
}

export async function verifyEmitMint(
    helper: ElrondHelper,
    action_id: BigNumber,
    to: string,
    value: number
): Promise<Transaction> {
    await helper.sender.sync(helper.provider);

    const tx = new Transaction({
        receiver: helper.mintContract,
        nonce: helper.sender.nonce,
        gasLimit: new GasLimit(50000000),
        // fn validate_send_xp(action_id: BigUint, to: Address, amount: BigUint, #[var_args] opt_data: OptionalArg<BoxedBytes>,)
        data: TransactionPayload.contractCall()
            .setFunction(new ContractFunction('validateSendXp'))
            .addArg(new BigUIntValue(action_id))
            .addArg(new AddressValue(new Address(to)))
            .addArg(new U32Value(value))
            .build(),
    });

    helper.signer.sign(tx);
    await tx.send(helper.provider);

    return tx;
}

export async function verifyEmitScCall(
    helper: ElrondHelper,
    value: number,
    action_id: BigNumber,
    target: string,
    endpoint: string,
    args?: string[], // List of arguments
): Promise<Transaction> {
    await helper.sender.sync(helper.provider)

    // fn validate_sc_call(action_id: BigUint, to: Address, endpoint: BoxedBytes, #[var_args] args: VarArgs<BoxedBytes>,)
    let payloadBuilder = TransactionPayload.contractCall()
        .setFunction(new ContractFunction("validateSCCall"))
        .addArg(new BigUIntValue(action_id))
        .addArg(new AddressValue(new Address(target)))
        .addArg(BytesValue.fromUTF8(endpoint))

    for (const buf of args ?? []) {
        payloadBuilder = payloadBuilder.addArg(BytesValue.fromHex(buf));
    }

    console.log(`args: ${JSON.stringify(payloadBuilder)}`)

    const tx = new Transaction({
        receiver: helper.mintContract,
        nonce: helper.sender.nonce,
        gasLimit: new GasLimit(80000000),
        data: payloadBuilder.build(),
        value: Balance.egld(value)
    });

    helper.signer.sign(tx);
    await tx.send(helper.provider);

    return tx;
}