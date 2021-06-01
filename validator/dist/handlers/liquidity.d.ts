import * as elrond from '../elrond';
import * as polkadot from '../polkadot';
import * as polkaT from '@polkadot/api-contract/types';
export declare function elrondTransferEventHandler(elrd: elrond.ElrondHelper, polka: polkadot.PolkadotHelper, id: string): Promise<void>;
export declare function polkaTransferEventHandler(_polka: polkadot.PolkadotHelper, elrd: elrond.ElrondHelper, event: polkaT.DecodedEvent): Promise<void>;
export declare function polkaScCallEventHandler(_polka: polkadot.PolkadotHelper, elrd: elrond.ElrondHelper, event: polkaT.DecodedEvent): Promise<void>;
