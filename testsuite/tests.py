import time

from polkadot import PolkadotHelper
from elrond import ElrondHelper


def liquidity_test(polka: PolkadotHelper, elrd: ElrondHelper) -> None:
    destination = input("Enter destination elrond address: ")
    value = int(input("Enter XP Token value: "))

    cur_b = elrd.check_esdt_bal(destination)
    target = cur_b + value
    print(f"{destination} current balance: {cur_b}")
    assert(polka.send_tokens(destination, value).is_success)
    while elrd.check_esdt_bal(destination) != target:
        time.sleep(2.5)

    print(f"{destination} new balance: {elrd.check_esdt_bal(destination)}")
