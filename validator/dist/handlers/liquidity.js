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
exports.polkaScCallEventHandler = exports.polkaTransferEventHandler = exports.elrondTransferEventHandler = void 0;
const elrond = __importStar(require("../elrond"));
const polkadot = __importStar(require("../polkadot"));
const bignumber_js_1 = __importDefault(require("bignumber.js"));
async function elrondTransferEventHandler(elrd, polka, id) {
    console.log(`received event ${id}`);
    const ev_info = await elrond.getDepositEvent(elrd, id);
    await polkadot.pop(polka, BigInt(id), ev_info[0], ev_info[1]);
}
exports.elrondTransferEventHandler = elrondTransferEventHandler;
async function polkaTransferEventHandler(_polka, elrd, event) {
    const action_id = new bignumber_js_1.default(event.args[0].toJSON());
    const to = event.args[1].toJSON();
    const value = event.args[2].toJSON();
    console.log(`action_id: ${action_id}`);
    console.log(`to: ${to}`);
    console.log(`value: ${value}`);
    const tx = await elrond.verifyEmitMint(elrd, action_id, to, value);
    console.log(`Hash: ${tx.getHash().toString()}`);
}
exports.polkaTransferEventHandler = polkaTransferEventHandler;
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
async function polkaScCallEventHandler(_polka, elrd, event) {
    const action_id = new bignumber_js_1.default(event.args[0].toJSON());
    const to = event.args[1].toJSON();
    const endpoint = event.args[2].toJSON();
    const args = event.args[3].toJSON();
    const tx = await elrond.verifyEmitScCall(elrd, 0, action_id, to, endpoint, scCallArgSanitize(args));
    console.log(`Hash: ${tx.getHash().toString()}`);
}
exports.polkaScCallEventHandler = polkaScCallEventHandler;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGlxdWlkaXR5LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2hhbmRsZXJzL2xpcXVpZGl0eS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsa0RBQW9DO0FBQ3BDLHNEQUF3QztBQUV4QyxnRUFBcUM7QUFHOUIsS0FBSyxVQUFVLDBCQUEwQixDQUFDLElBQXlCLEVBQUUsS0FBOEIsRUFBRSxFQUFVO0lBQ2xILE9BQU8sQ0FBQyxHQUFHLENBQUMsa0JBQWtCLEVBQUUsRUFBRSxDQUFDLENBQUM7SUFDcEMsTUFBTSxPQUFPLEdBQUcsTUFBTSxNQUFNLENBQUMsZUFBZSxDQUFDLElBQUksRUFBRSxFQUFFLENBQUMsQ0FBQztJQUN2RCxNQUFNLFFBQVEsQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxFQUFFLENBQUMsRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDbEUsQ0FBQztBQUpELGdFQUlDO0FBR00sS0FBSyxVQUFVLHlCQUF5QixDQUFDLE1BQStCLEVBQUUsSUFBeUIsRUFBRSxLQUEwQjtJQUNsSSxNQUFNLFNBQVMsR0FBRyxJQUFJLHNCQUFTLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLEVBQVksQ0FBQyxDQUFDO0lBQ2xFLE1BQU0sRUFBRSxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxFQUFZLENBQUM7SUFDNUMsTUFBTSxLQUFLLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLEVBQVksQ0FBQztJQUUvQyxPQUFPLENBQUMsR0FBRyxDQUFDLGNBQWMsU0FBUyxFQUFFLENBQUMsQ0FBQztJQUN2QyxPQUFPLENBQUMsR0FBRyxDQUFDLE9BQU8sRUFBRSxFQUFFLENBQUMsQ0FBQztJQUN6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