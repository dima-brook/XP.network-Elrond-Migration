"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyEmitScCall = exports.verifyEmitMint = exports.getDepositEvent = exports.newHelper = void 0;
const erdjs_1 = require("@elrondnetwork/erdjs");
const bignumber_js_1 = require("bignumber.js");
async function newHelper(node_uri, secret_key, sender, minter, socket) {
    const provider = new erdjs_1.ProxyProvider(node_uri);
    await erdjs_1.NetworkConfig.getDefault().sync(provider);
    const eMinterAddr = new erdjs_1.Address(sender);
    const senderac = new erdjs_1.Account(eMinterAddr);
    const signer = new erdjs_1.UserSigner(erdjs_1.parseUserKey(secret_key));
    return {
        provider: provider,
        sender: senderac,
        signer: signer,
        mintContract: new erdjs_1.Address(minter),
        eventSocket: socket
    };
}
exports.newHelper = newHelper;
const transfer_event_t = new erdjs_1.StructType("TransferEvent", [
    new erdjs_1.StructFieldDefinition("to", "", new erdjs_1.ListType(new erdjs_1.U8Type())),
    new erdjs_1.StructFieldDefinition("value", "", new erdjs_1.BigUIntType())
]);
async function getDepositEvent(helper, id) {
    await helper.sender.sync(helper.provider);
    const tx = new erdjs_1.Transaction({
        receiver: helper.mintContract,
        nonce: helper.sender.nonce,
        gasLimit: new erdjs_1.GasLimit(50000000),
        data: erdjs_1.TransactionPayload.contractCall()
            .setFunction(new erdjs_1.ContractFunction("eventRead"))
            .addArg(new erdjs_1.BigUIntValue(new bignumber_js_1.BigNumber(id)))
            .build(),
    });
    helper.signer.sign(tx);
    await tx.send(helper.provider);
    await tx.awaitNotarized(helper.provider);
    console.log(`tx hash: ${tx.getHash().toString()}`);
    const res = (await tx.getAsOnNetwork(helper.provider)).getSmartContractResults();
    const data = res.getImmediate().outputUntyped();
    const decoder = new erdjs_1.BinaryCodec();
    const fin = decoder.decodeTopLevel(data[0], transfer_event_t).valueOf();
    return [Buffer.from((fin["to"])).toString(), fin["value"]];
}
exports.getDepositEvent = getDepositEvent;
async function verifyEmitMint(helper, action_id, to, value) {
    await helper.sender.sync(helper.provider);
    const tx = new erdjs_1.Transaction({
        receiver: helper.mintContract,
        nonce: helper.sender.nonce,
        gasLimit: new erdjs_1.GasLimit(50000000),
        // fn validate_send_xp(action_id: BigUint, to: Address, amount: BigUint, #[var_args] opt_data: OptionalArg<BoxedBytes>,)
        data: erdjs_1.TransactionPayload.contractCall()
            .setFunction(new erdjs_1.ContractFunction('validateSendXp'))
            .addArg(new erdjs_1.BigUIntValue(action_id))
            .addArg(new erdjs_1.AddressValue(new erdjs_1.Address(to)))
            .addArg(new erdjs_1.U32Value(value))
            .build(),
    });
    helper.signer.sign(tx);
    await tx.send(helper.provider);
    return tx;
}
exports.verifyEmitMint = verifyEmitMint;
async function verifyEmitScCall(helper, value, action_id, target, endpoint, args) {
    await helper.sender.sync(helper.provider);
    // fn validate_sc_call(action_id: BigUint, to: Address, endpoint: BoxedBytes, #[var_args] args: VarArgs<BoxedBytes>,)
    let payloadBuilder = erdjs_1.TransactionPayload.contractCall()
        .setFunction(new erdjs_1.ContractFunction("validateSCCall"))
        .addArg(new erdjs_1.BigUIntValue(action_id))
        .addArg(new erdjs_1.AddressValue(new erdjs_1.Address(target)))
        .addArg(erdjs_1.BytesValue.fromUTF8(endpoint));
    for (const buf of args !== null && args !== void 0 ? args : []) {
        payloadBuilder = payloadBuilder.addArg(erdjs_1.BytesValue.fromHex(buf));
    }
    console.log(`args: ${JSON.stringify(payloadBuilder)}`);
    const tx = new erdjs_1.Transaction({
        receiver: helper.mintContract,
        nonce: helper.sender.nonce,
        gasLimit: new erdjs_1.GasLimit(80000000),
        data: payloadBuilder.build(),
        value: erdjs_1.Balance.egld(value)
    });
    helper.signer.sign(tx);
    await tx.send(helper.provider);
    return tx;
}
exports.verifyEmitScCall = verifyEmitScCall;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWxyb25kLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2Vscm9uZC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxnREF3QjhCO0FBRTlCLCtDQUF5QztBQVdsQyxLQUFLLFVBQVUsU0FBUyxDQUMzQixRQUFnQixFQUNoQixVQUFrQixFQUNsQixNQUFjLEVBQ2QsTUFBYyxFQUNkLE1BQWM7SUFFZCxNQUFNLFFBQVEsR0FBRyxJQUFJLHFCQUFhLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDN0MsTUFBTSxxQkFBYSxDQUFDLFVBQVUsRUFBRSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUNoRCxNQUFNLFdBQVcsR0FBRyxJQUFJLGVBQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUN4QyxNQUFNLFFBQVEsR0FBRyxJQUFJLGVBQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQztJQUMxQyxNQUFNLE1BQU0sR0FBRyxJQUFJLGtCQUFVLENBQUMsb0JBQVksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO0lBRXhELE9BQU87UUFDSCxRQUFRLEVBQUUsUUFBUTtRQUNsQixNQUFNLEVBQUUsUUFBUTtRQUNoQixNQUFNLEVBQUUsTUFBTTtRQUNkLFlBQVksRUFBRSxJQUFJLGVBQU8sQ0FBQyxNQUFNLENBQUM7UUFDakMsV0FBVyxFQUFFLE1BQU07S0FDdEIsQ0FBQztBQUNOLENBQUM7QUFwQkQsOEJBb0JDO0FBRUQsTUFBTSxnQkFBZ0IsR0FBRyxJQUFJLGtCQUFVLENBQUMsZUFBZSxFQUFFO0lBQ3JELElBQUksNkJBQXFCLENBQUMsSUFBSSxFQUFFLEVBQUUsRUFBRSxJQUFJLGdCQUFRLENBQUMsSUFBSSxjQUFNLEVBQUUsQ0FBQyxDQUFDO0lBQy9ELElBQUksNkJBQXFCLENBQUMsT0FBTyxFQUFFLEVBQUUsRUFBRSxJQUFJLG1CQUFXLEVBQUUsQ0FBQztDQUM1RCxDQUFDLENBQUE7QUFFSyxLQUFLLFVBQVUsZUFBZSxDQUNqQyxNQUFv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