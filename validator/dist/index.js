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
const fs = __importStar(require("fs"));
const socket_io_client_1 = require("socket.io-client");
const chain_handler_1 = require("./chain_handler");
const config_1 = __importDefault(require("./config"));
const freezer_abi = __importStar(require("./freezer_abi.json"));
const elrond_1 = require("./handlers/elrond");
const polkadot_1 = require("./handlers/polkadot");
const main = async () => {
    const private_key = await fs.promises.readFile(config_1.default.private_key, "utf-8");
    const polka = await polkadot_1.PolkadotHelper.new(config_1.default.xnode, freezer_abi, config_1.default.xp_freezer);
    const elrd = await elrond_1.ElrondHelper.new(config_1.default.elrond_node, private_key, config_1.default.elrond_sender, config_1.default.elrond_minter, socket_io_client_1.io(config_1.default.elrond_ev_socket));
    console.log('READY TO LISTEN EVENTS!');
    chain_handler_1.emitEvents(polka, elrd);
};
main();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsdUNBQXlCO0FBRXpCLHVEQUFzQztBQUN0QyxtREFBNkM7QUFDN0Msc0RBQThCO0FBQzlCLGdFQUFrRDtBQUNsRCw4Q0FBaUQ7QUFDakQsa0RBQXFEO0FBRXJELE1BQU0sSUFBSSxHQUFHLEtBQUssSUFBSSxFQUFFO0lBQ3BCLE1BQU0sV0FBVyxHQUFHLE1BQU0sRUFBRSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsZ0JBQU0sQ0FBQyxXQUFXLEVBQUUsT0FBTyxDQUFDLENBQUM7SUFFNUUsTUFBTSxLQUFLLEdBQUcsTUFBTSx5QkFBYyxDQUFDLEdBQUcsQ0FDbEMsZ0JBQU0sQ0FBQyxLQUFLLEVBQ1osV0FBVyxFQUNYLGdCQUFNLENBQUMsVUFBVSxDQUNwQixDQUFDO0lBQ0YsTUFBTSxJQUFJLEdBQUcsTUFBTSxxQkFBWSxDQUFDLEdBQUcsQ0FDL0IsZ0JBQU0sQ0FBQyxXQUFXLEVBQ2xCLFdBQVcsRUFDWCxnQkFBTSxDQUFDLGFBQWEsRUFDcEIsZ0JBQU0sQ0FBQyxhQUFhLEVBQ3BCLHFCQUFFLENBQUMsZ0JBQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxDQUM5QixDQUFDO0lBRUYsT0FBTyxDQUFDLEdBQUcsQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDO0lBRXZDLDBCQUFVLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxDQUFDO0FBQzVCLENBQUMsQ0FBQztBQUVGLElBQUksRUFBRSxDQUFDIn0=