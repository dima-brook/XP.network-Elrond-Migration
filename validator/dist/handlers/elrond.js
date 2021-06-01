"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ElrondHelper = void 0;
const erdjs_1 = require("@elrondnetwork/erdjs");
const bignumber_js_1 = __importDefault(require("bignumber.js"));
const chain_handler_1 = require("../chain_handler");
const transfer_event_t = new erdjs_1.StructType("TransferEvent", [
    new erdjs_1.StructFieldDefinition("to", "", new erdjs_1.ListType(new erdjs_1.U8Type())),
    new erdjs_1.StructFieldDefinition("value", "", new erdjs_1.BigUIntType())
]);
class ElrondHelper {
    constructor(provider, sender, signer, mintContract, eventSocket) {
        this.provider = provider;
        this.sender = sender;
        this.signer = signer;
        this.mintContract = mintContract;
        this.eventSocket = eventSocket;
    }
    async eventIter(cb) {
        this.eventSocket.on("elrond:transfer_event", async (id) => await cb(id));
    }
    async eventHandler(id) {
        const [to, value] = await this.unfreezeEventHandler(id);
        return new chain_handler_1.UnfreezeEvent(new bignumber_js_1.default(id), to, new bignumber_js_1.default(value.toString()));
    }
    async emittedEventHandler(event) {
        let tx;
        if (event instanceof chain_handler_1.TransferEvent) {
            tx = await this.transferMintVerify(event);
        }
        else if (event instanceof chain_handler_1.ScCallEvent) {
            tx = await this.scCallVerify(event);
        }
        else {
            throw Error("Unsupported event!");
        }
        console.log(`Elrond event hash: ${tx.getHash().toString()}`);
    }
    async transferMintVerify({ action_id, to, value }) {
        await this.sender.sync(this.provider);
        const tx = new erdjs_1.Transaction({
            receiver: this.mintContract,
            nonce: this.sender.nonce,
            gasLimit: new erdjs_1.GasLimit(50000000),
            data: erdjs_1.TransactionPayload.contractCall()
                .setFunction(new erdjs_1.ContractFunction('validateSendXp'))
                .addArg(new erdjs_1.BigUIntValue(action_id))
                .addArg(new erdjs_1.AddressValue(new erdjs_1.Address(to)))
                .addArg(new erdjs_1.U32Value(value))
                .build(),
        });
        this.signer.sign(tx);
        await tx.send(this.provider);
        return tx;
    }
    async unfreezeEventHandler(id) {
        await this.sender.sync(this.provider);
        const tx = new erdjs_1.Transaction({
            receiver: this.mintContract,
            nonce: this.sender.nonce,
            gasLimit: new erdjs_1.GasLimit(50000000),
            data: erdjs_1.TransactionPayload.contractCall()
                .setFunction(new erdjs_1.ContractFunction("eventRead"))
                .addArg(new erdjs_1.BigUIntValue(new bignumber_js_1.default(id)))
                .build(),
        });
        this.signer.sign(tx);
        await tx.send(this.provider);
        await tx.awaitNotarized(this.provider);
        console.log(`tx hash: ${tx.getHash().toString()}`);
        const res = (await tx.getAsOnNetwork(this.provider)).getSmartContractResults();
        const data = res.getImmediate().outputUntyped();
        const decoder = new erdjs_1.BinaryCodec();
        const fin = decoder.decodeTopLevel(data[0], transfer_event_t).valueOf();
        return [Buffer.from((fin["to"])).toString(), fin["value"]];
    }
    async scCallVerify({ action_id, to, value, endpoint, args }) {
        await this.sender.sync(this.provider);
        // fn validate_sc_call(action_id: BigUint, to: Address, endpoint: BoxedBytes, #[var_args] args: VarArgs<BoxedBytes>,)
        let payloadBuilder = erdjs_1.TransactionPayload.contractCall()
            .setFunction(new erdjs_1.ContractFunction("validateSCCall"))
            .addArg(new erdjs_1.BigUIntValue(action_id))
            .addArg(new erdjs_1.AddressValue(new erdjs_1.Address(to)))
            .addArg(erdjs_1.BytesValue.fromUTF8(endpoint));
        for (const buf of args !== null && args !== void 0 ? args : []) {
            payloadBuilder = payloadBuilder.addArg(erdjs_1.BytesValue.fromHex(buf));
        }
        console.log(`args: ${JSON.stringify(payloadBuilder)}`);
        const tx = new erdjs_1.Transaction({
            receiver: this.mintContract,
            nonce: this.sender.nonce,
            gasLimit: new erdjs_1.GasLimit(80000000),
            data: payloadBuilder.build(),
            value: erdjs_1.Balance.egld(value)
        });
        this.signer.sign(tx);
        await tx.send(this.provider);
        return tx;
    }
}
exports.ElrondHelper = ElrondHelper;
ElrondHelper.new = async (node_uri, secret_key, sender, minter, socket) => {
    const provider = new erdjs_1.ProxyProvider(node_uri);
    await erdjs_1.NetworkConfig.getDefault().sync(provider);
    const eMinterAddr = new erdjs_1.Address(sender);
    const senderac = new erdjs_1.Account(eMinterAddr);
    const signer = new erdjs_1.UserSigner(erdjs_1.parseUserKey(secret_key));
    return new ElrondHelper(provider, senderac, signer, new erdjs_1.Address(minter), socket);
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWxyb25kLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2hhbmRsZXJzL2Vscm9uZC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSxnREF3QjhCO0FBQzlCLGdFQUFxQztBQUVyQyxvREFBMkc7QUFHM0csTUFBTSxnQkFBZ0IsR0FBRyxJQUFJLGtCQUFVLENBQUMsZUFBZSxFQUFFO0lBQ3JELElBQUksNkJBQXFCLENBQUMsSUFBSSxFQUFFLEVBQUUsRUFBRSxJQUFJLGdCQUFRLENBQUMsSUFBSSxjQUFNLEVBQUUsQ0FBQyxDQUFDO0lBQy9ELElBQUksNkJBQXFCLENBQUMsT0FBTyxFQUFFLEVBQUUsRUFBRSxJQUFJLG1CQUFXLEVBQUUsQ0FBQztDQUM1RCxDQUFDLENBQUM7QUFFSCxNQUFhLFlBQVk7SUFPckIsWUFBb0IsUUFBdUIsRUFBRSxNQUFlLEVBQUUsTUFBZSxFQUFFLFlBQXFCLEVBQUUsV0FBbUI7UUFDckgsSUFBSSxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUM7UUFDekIsSUFBSSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUM7UUFDckIsSUFBSSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUM7UUFDckIsSUFBSSxDQUFDLFlBQVksR0FBRyxZQUFZLENBQUM7UUFDakMsSUFBSSxDQUFDLFdBQVcsR0FBRyxXQUFXLENBQUM7SUFDbkMsQ0FBQztJQUVELEtBQUssQ0FBQyxTQUFTLENBQUMsRUFBb0M7UUFDaEQsSUFBSSxDQUFDLFdBQVcsQ0FBQyxFQUFFLENBQUMsdUJBQXVCLEVBQUUsS0FBSyxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQTtJQUM1RSxDQUFDO0lBa0JELEtBQUssQ0FBQyxZQUFZLENBQUMsRUFBVTtRQUN6QixNQUFNLENBQUMsRUFBRSxFQUFFLEtBQUssQ0FBQyxHQUFHLE1BQU0sSUFBSSxDQUFDLG9CQUFvQixDQUFDLEVBQUUsQ0FB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