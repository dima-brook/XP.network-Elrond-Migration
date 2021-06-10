import time
import erdpy.accounts
import requests

from polkadot import PolkadotHelper
from elrond import ElrondHelper


def liquidity_p2e(polka: PolkadotHelper, elrd: ElrondHelper) -> None:
    destination = input("Enter destination elrond address(bech32): ")
    value = int(input("Enter XP Token value(pico): "))

    cur_b = elrd.check_esdt_bal(destination)
    target = cur_b + value
    print(f"{destination} current balance: {cur_b}")
    assert(polka.send_tokens(destination, value).is_success)
    while elrd.check_esdt_bal(destination) != target:
        time.sleep(2.5)

    print(f"{destination} new balance: {elrd.check_esdt_bal(destination)}")


def liquidity_e2p(elrd: ElrondHelper) -> None:
    destination = input("Enter destination polkadot address: ")
    value = int(input("Enter XP Token value(pico): "))
    pem = input("Enter sender's(elrond) pem file: ")

    sender = erdpy.accounts.Account(pem_file=pem)

    tx = elrd.unfreeze(sender, destination, value)
    print(f"TX Hash: {tx.hash}")
    event_id = input("Enter event id from transaction: ")

    sender_addr = sender.address.bech32()

    cur_b = elrd.check_esdt_bal(sender_addr)
    target = cur_b - value

    requests.post(f"{elrd.event_uri}/event/transfer", headers={"id": event_id})  # noqa: E501
    print("sent request! Receiving token may take a while")

    print(f"{sender_addr} elrd token balance: {cur_b}")
    while elrd.check_esdt_bal(sender_addr) != target:
        time.sleep(2.5)

    print(f"{sender.address} elrd token new balance: {target}")

    input("Please press enter once you have received the tokens")


def liquidity_test(polka: PolkadotHelper, elrd: ElrondHelper) -> None:
    print("Send Test (polkadot -> Elrond)")
    liquidity_p2e(polka, elrd)

    input("Press enter to continue")

    print("Unfreeze Test (Elrond -> Polkadot)")
    liquidity_e2p(elrd)
