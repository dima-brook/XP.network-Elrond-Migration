from elrond import ElrondHelper
from polkadot import PolkadotHelper
from validator import ValidatorHelper
from config import Config, ValidatorRuntimeConfig
from typing import Tuple

from tests import liquidity_test


def setup(config: Config) -> Tuple[PolkadotHelper, ElrondHelper]:
    validator = ValidatorHelper(config.validator.project)
    polka = PolkadotHelper.setup(config.polkadot)
    print()
    elrd = ElrondHelper.setup(config.elrond)
    print()

    print("dumping validator config...")
    rtconf = ValidatorRuntimeConfig(
        xnode=config.polkadot.uri,
        elrond_node=config.elrond.uri,
        private_key=config.elrond.sender,
        elrond_sender=elrd.sender.address.bech32(),
        elrond_minter=elrd.contract.address.bech32(),
        xp_freezer=polka.contract.contract_address,
        elrond_ev_socket=config.elrond.event_socket
    )
    validator.dump_config(rtconf)
    print("starting validator...")
    validator.spawn()

    return polka, elrd


def main() -> None:
    config = Config()
    polka, elrd = setup(config)

    liquidity_test(polka, elrd)


if __name__ == "__main__":
    main()
