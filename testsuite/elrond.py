from erdpy.interfaces import IElrondProxy
import consts
import time
import requests

from typing import Any, cast

from erdpy import config
from erdpy.proxy import ElrondProxy
from erdpy.accounts import Account, Address
from erdpy.contracts import SmartContract
from erdpy.projects import ProjectRust
from erdpy.transactions import Transaction


def wait_transaction_done(tx_hash: str) -> Any:
    time.sleep(3)
    while data := requests.get(consts.ELROND_TX_URI.format(tx_hash)):
        res = data.json()
        if res["code"] != "successful":
            raise Exception(f"failed to execute tx: {tx_hash}, \
                            error: {res['error']}")

        res = res["data"]["transaction"]
        if res["status"] == "pending":
            time.sleep(5)
            continue
        elif res["status"] != "success":
            raise Exception(f"failed to execute tx: {tx_hash}, \
                            status: {res['transaction']['status']}")

        return res


class ElrondHelper:
    def __init__(self, proxy: str, sender_pem: str, project_folder: str):
        self.proxy = ElrondProxy(proxy)
        self.proxy_uri = proxy
        self.sender = Account(pem_file=sender_pem)
        self.project = ProjectRust(project_folder)
        self.sender.sync_nonce(self.proxy)

    def prepare_esdt(self) -> str:
        tx = Transaction()
        tx.value = str(consts.ELROND_ESDT_VALUE)
        tx.sender = self.sender.address.bech32()
        tx.receiver = consts.ELROND_ESDT_SC_ADDR
        tx.gasPrice = consts.ELROND_GAS_PRICE
        tx.gasLimit = consts.ELROND_ESDT_GASL
        tx.data = consts.ELROND_ESDT_ISSUE_DATA
        tx.chainID = str(self.proxy.get_chain_id())
        tx.version = config.get_tx_version()

        self.sender.sync_nonce(self.proxy)
        tx.nonce = self.sender.nonce

        tx.sign(self.sender)
        tx.send(cast(IElrondProxy, self.proxy))
        self.esdt_hex = str(
            wait_transaction_done(tx.hash)["smartContractResults"][-1]["data"]
        ).split("@")[1]

        return bytes.fromhex(self.esdt_hex).decode("utf-8")

    def deploy_sc(self, clean: bool = False) -> Address:
        if not self.esdt_hex:
            raise Exception("Deploy called before prepare_esdt!")

        if clean:
            self.project.clean()
        self.project.build()

        contract = SmartContract(bytecode=self.project.get_bytecode())
        self.sender.sync_nonce(self.proxy)
        tx = contract.deploy(
            self.sender,
            consts.ELROND_CONTRACT_ARGS.format(
                esdt=self.esdt_hex,
                sender=self.sender.address.hex().replace("0x", "")
            ).split(),
            consts.ELROND_GAS_PRICE,
            consts.ELROND_ESDT_GASL,
            value=0,
            chain=str(self.proxy.get_chain_id()),
            version=config.get_tx_version()
        )
        tx.send(cast(IElrondProxy, self.proxy))
        wait_transaction_done(tx.hash)

        self.contract = contract

        return contract.address

    def setup_sc_perms(self) -> Transaction:
        if not self.contract:
            raise Exception("Setup SC called before deploy!")

        tx = Transaction()
        tx.value = str(0)
        tx.sender = self.sender.address.bech32()
        tx.receiver = consts.ELROND_ESDT_SC_ADDR
        tx.gasPrice = consts.ELROND_GAS_PRICE
        tx.gasLimit = consts.ELROND_ESDT_GASL
        tx.data = consts.ELROND_SETROLE_DATA.format(
            esdt=self.esdt_hex,
            sc_addr=self.contract.address.hex().replace("0x", "")
        )
        tx.chainID = str(self.proxy.get_chain_id())
        tx.version = config.get_tx_version()

        self.sender.sync_nonce(self.proxy)
        tx.nonce = self.sender.nonce

        tx.sign(self.sender)
        tx.send(cast(IElrondProxy, self.proxy))
        wait_transaction_done(tx.hash)

        return tx
