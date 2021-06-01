"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PolkadotHelper = void 0;
const api_1 = require("@polkadot/api");
const api_contract_1 = require("@polkadot/api-contract");
const bignumber_js_1 = __importDefault(require("bignumber.js"));
const aliceJ = __importStar(require("../alice.json"));
const chain_handler_1 = require("../chain_handler");
function sanitizeInner(arg) {
    if (typeof arg == "string") {
        return arg.replace('0x', '');
    }
    else if (typeof arg == "number") {
        return (arg % 2 ? '0' : '') + arg.toString(16);
    }
    else if (typeof arg == "boolean") {
        return arg ? '01' : '00';
    }
    else {
        return ""; // unreachable
    }
}
function scCallArgSanitize(arg) {
    if (typeof arg == "string" || typeof arg == "boolean" || typeof arg == "number") {
        return Array.of(sanitizeInner(arg));
    }
    else if (!arg) {
        return undefined;
    }
    else {
        return arg.map((v) => sanitizeInner(v));
    }
}
class PolkadotHelper {
    constructor(api, freezer, alice) {
        this.api = api;
        this.freezer = freezer;
        this.alice = alice;
    }
    async eventIter(cb) {
        this.api.query.system.events(async (events) => {
            events.forEach((event) => cb(event));
        });
    }
    async subscribe() {
        await this.freezer.tx
            .subscribe({ value: 0, gasLimit: -1 })
            .signAndSend(this.alice, (result) => {
            console.log(`sub tx: ${result.status}`);
        });
    }
    async eventHandler(ev) {
        const event = ev.event;
        // Not a contract event
        if (event.method != 'ContractEmitted') {
            return;
        }
        // Not our contract
        if (event.data[0].toString() != this.freezer.address.toString()) {
            return;
        }
        const cev = this.freezer.abi.decodeEvent(Buffer.from(event.data[1].toString().replace('0x', ''), 'hex'));
        switch (cev.event.identifier) {
            case "Transfer": {
                const action_id = new bignumber_js_1.default(cev.args[0].toJSON());
                const to = cev.args[1].toJSON();
                const value = new bignumber_js_1.default(cev.args[2].toJSON());
                return new chain_handler_1.TransferEvent(action_id, to, value);
            }
            case "ScCall": {
                const action_id = new bignumber_js_1.default(cev.args[0].toJSON());
                const to = cev.args[1].toJSON();
                const endpoint = cev.args[2].toJSON();
                const args = cev.args[3].toJSON();
                return new chain_handler_1.ScCallEvent(action_id, to, new bignumber_js_1.default(0), endpoint, scCallArgSanitize(args));
            }
            default:
                throw Error(`unhandled event: ${cev.event.identifier}`);
        }
    }
    async emittedEventHandler(event) {
        await this.unfreeze(event);
    }
    async unfreeze(event) {
        console.log(`unfreeze! to: ${event.to}, value: ${event.value}`);
        await this.freezer.tx
            .pop({ value: 0, gasLimit: -1 }, event.id.toString(), event.to, event.value.toNumber())
            .signAndSend(this.alice, (result) => {
            console.log("pop tx:", result.status);
        });
    }
}
exports.PolkadotHelper = PolkadotHelper;
PolkadotHelper.new = async (node_uri, freezer_abi, contract_addr) => {
    const provider = new api_1.WsProvider(node_uri);
    const api = await api_1.ApiPromise.create({ provider: provider });
    const freezer = new api_contract_1.ContractPromise(api, freezer_abi, contract_addr);
    const keyring = new api_1.Keyring({});
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    const alice = keyring.addFromJson(aliceJ);
    alice.unlock("ahPQDcuGjPJDMe4");
    const helper = new PolkadotHelper(api, freezer, alice);
    await helper.subscribe();
    return helper;
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9sa2Fkb3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvaGFuZGxlcnMvcG9sa2Fkb3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLHVDQUFnRTtBQUNoRSx5REFBeUQ7QUFLekQsZ0VBQXFDO0FBRXJDLHNEQUF3QztBQUN4QyxvREFBMEc7QUFNMUcsU0FBUyxhQUFhLENBQUMsR0FBYTtJQUNoQyxJQUFJLE9BQU8sR0FBRyxJQUFJLFFBQVEsRUFBRTtRQUN4QixPQUFPLEdBQUcsQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQyxDQUFBO0tBQy9CO1NBQU0sSUFBSSxPQUFPLEdBQUcsSUFBSSxRQUFRLEVBQUU7UUFDL0IsT0FBTyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsR0FBRyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsQ0FBQTtLQUNqRDtTQUFNLElBQUksT0FBTyxHQUFHLElBQUksU0FBUyxFQUFFO1FBQ2hDLE9BQU8sR0FBRyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQTtLQUMzQjtTQUFNO1FBQ0gsT0FBTyxFQUFFLENBQUMsQ0FBQyxjQUFjO0tBQzVCO0FBQ0wsQ0FBQztBQUVELFNBQVMsaUJBQWlCLENBQUMsR0FBWTtJQUNuQyxJQUFJLE9BQU8sR0FBRyxJQUFJLFFBQVEsSUFBSSxPQUFPLEdBQUcsSUFBSSxTQUFTLElBQUksT0FBTyxHQUFHLElBQUksUUFBUSxFQUFFO1FBQzdFLE9BQU8sS0FBSyxDQUFDLEVBQUUsQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQTtLQUN0QztTQUFNLElBQUksQ0FBQyxHQUFHLEVBQUU7UUFDYixPQUFPLFNBQVMsQ0FBQztLQUNwQjtTQUFNO1FBQ0gsT0FBUSxHQUFpQixDQUFDLEdB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