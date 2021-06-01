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
Object.defineProperty(exports, "__esModule", { value: true });
exports.pop = exports.subscribe = exports.newHelper = void 0;
const api_1 = require("@polkadot/api");
const api_contract_1 = require("@polkadot/api-contract");
const alice = __importStar(require("./alice.json"));
async function newHelper(node_uri, freezer_abi, contract_addr) {
    const provider = new api_1.WsProvider(node_uri);
    const api = await api_1.ApiPromise.create({ provider: provider });
    const freezer = new api_contract_1.ContractPromise(api, freezer_abi, contract_addr);
    const keyring = new api_1.Keyring({});
    let ret = {
        api: api,
        freezer: freezer,
        //@ts-ignore
        alice: keyring.addFromJson(alice)
    };
    ret.alice.unlock("ahPQDcuGjPJDMe4");
    console.log(`alice addr: ${ret.alice.address}`);
    await subscribe(ret);
    return ret;
}
exports.newHelper = newHelper;
async function subscribe(helper) {
    await helper.freezer.tx
        .subscribe({ value: 0, gasLimit: -1 })
        .signAndSend(helper.alice, (result) => {
        console.log(`sub tx: ${result.status}`);
    });
}
exports.subscribe = subscribe;
async function pop(helper, id, to, value) {
    console.log(`to: ${to}, value: ${value}`);
    await helper.freezer.tx
        .pop({ value: 0, gasLimit: -1 }, id.toString(), to, parseInt(value.toString()))
        .signAndSend(helper.alice, (result) => {
        console.log("pop tx:", result.status);
    });
}
exports.pop = pop;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9sa2Fkb3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvcG9sa2Fkb3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLHVDQUFnRTtBQUNoRSx5REFBeUQ7QUFLekQsb0RBQXNDO0FBUS9CLEtBQUssVUFBVSxTQUFTLENBQzNCLFFBQWdCLEVBQ2hCLFdBQXlCLEVBQ3pCLGFBQXFCO0lBRXJCLE1BQU0sUUFBUSxHQUFHLElBQUksZ0JBQVUsQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUMxQyxNQUFNLEdBQUcsR0FBRyxNQUFNLGdCQUFVLENBQUMsTUFBTSxDQUFDLEVBQUUsUUFBUSxFQUFFLFFBQVEsRUFBRSxDQUFDLENBQUM7SUFDNUQsTUFBTSxPQUFPLEdBQUcsSUFBSSw4QkFBZSxDQUFDLEdBQUcsRUFBRSxXQUFXLEVBQUUsYUFBYSxDQUFDLENBQUM7SUFFckUsTUFBTSxPQUFPLEdBQUcsSUFBSSxhQUFPLENBQUMsRUFBRSxDQUFDLENBQUM7SUFHaEMsSUFBSSxHQUFHLEdBQUc7UUFDTixHQUFHLEVBQUUsR0FBRztRQUNSLE9BQU8sRUFBRSxPQUFPO1FBQ2hCLFlBQVk7UUFDWixLQUFLLEVBQUUsT0FBTyxDQUFDLFdBQVcsQ0FBQyxLQUF5QixDQUFDO0tBQ3hELENBQUM7SUFFRixHQUFHLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO0lBRXBDLE9BQU8sQ0FBQyxHQUFHLENBQUMsZUFBZSxHQUFHLENBQUMsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUM7SUFFaEQsTUFBTSxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUM7SUFFckIsT0FBTyxHQUFHLENBQUM7QUFDZixDQUFDO0FBMUJELDhCQTBCQztBQUVNLEtBQUssVUFBVSxTQUFTLENBQUMsTUFBc0I7SUFDbEQsTUFBTSxNQUFNLENBQUMsT0FBTyxDQUFDLEVBQUU7U0FDbEIsU0FBUyxDQUFDLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxRQUFRLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQztTQUNyQyxXQUFXLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRSxDQUFDLE1BQU0sRUFBRSxFQUFFO1FBQ2xDLE9BQU8sQ0FBQyxHQUFHLENBQUMsV0FBVyxNQUFNLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQTtJQUMzQyxDQUFDLENBQUMsQ0FBQztBQUNYLENBQUM7QUFORCw4QkFNQztBQUVNLEtBQUssVUFBVSxHQUFHLENBQUMsTUFBc0IsRUFBRSxFQUFVLEVBQUUsRUFBVSxFQUFFLEtBQWE7SUFDbkYsT0FBTyxDQUFDLEdBQUcsQ0FBQyxPQUFPLEVBQUUsWUFBWSxLQUFLLEVBQUUsQ0FBQyxDQUFDO0lBQzFDLE1BQU0sTUFBTSxDQUFDLE9BQU8sQ0FBQyxFQUFFO1NBQ2xCLEdBQUcsQ0FBQyxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsUUFBUSxFQUFFLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLFFBQVEsRUFBRSxFQUFFLEVBQUUsRUFBRSxRQUFRLENBQUMsS0FBSyxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7U0FDOUUsV0FBVyxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsQ0FBQyxNQUFNLEVBQUUsRUFBRTtRQUNsQyxPQUFPLENBQUMsR0FBRyxDQUFDLFNBQVMsRUFBRSxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDMUMsQ0FBQyxDQUFDLENBQUM7QUFDWCxDQUFDO0FBUEQsa0JBT0MifQ==