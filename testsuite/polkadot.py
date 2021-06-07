from __future__ import annotations

from substrateinterface.exceptions import ExtrinsicFailedException
from config import PolkadotConfig
import consts
import subprocess

from pathlib import Path
from typing import cast

from substrateinterface import SubstrateInterface, Keypair
from substrateinterface.contracts import ContractCode, ContractExecutionReceipt


class PolkadotHelper:
    def __init__(self, provider: str, project: str):
        self.substrate = SubstrateInterface(
            url=provider,
            ss58_format=42,
            type_registry_preset='default'
        )
        self.project = project
        self.sender = Keypair.create_from_uri(consts.ALICE_URI)

    @classmethod
    def setup(cls, config: PolkadotConfig) -> PolkadotHelper:
        print("Polkadot setup")

        polka = cls(config.uri, config.project)
        print(f"deployed contract: {polka.deploy_sc()}")

        print(f"sending coins to validator: {config.validator}")
        call = polka.substrate.compose_call(
            call_module='Balances',
            call_function='transfer',
            call_params={
                'dest': config.validator,
                'value': 10**16
            }
        )
        ext = polka.substrate.create_signed_extrinsic(call, polka.sender)
        polka.substrate.submit_extrinsic(ext, wait_for_inclusion=True)

        return polka

    def deploy_sc(self) -> str:
        subprocess.run(
            ["cargo", "+nightly", "contract", "build"],
            check=True,
            cwd=self.project
        )

        target = Path(consts.POLKADOT_OUT_DIR.format(project=self.project))
        code = ContractCode.create_from_contract_files(
            wasm_file=list(target.glob("*.wasm"))[0].as_posix(),
            metadata_file="./workaround.json",
            substrate=self.substrate
        )

        try:
            self.contract = code.deploy(
               keypair=self.sender,
               constructor="default",
               upload_code=True,
               endowment=consts.POLKADOT_FREEZER_ENDOW,
               gas_limit=consts.POLKADOT_DEPLOY_GASL
            )
        except ExtrinsicFailedException as e:
            if e.args[0]["name"] == "DuplicateContract":
                print("WARN: Contract is predeployed. not handled yet!")
            else:
                raise e

        return str(self.contract.contract_address)

    def send_tokens(self, to: str, value: int) -> ContractExecutionReceipt:
        dry = self.contract.read(
            self.sender,
            consts.FREEZER_SEND_CALL,
            args={'to': to},
            value=value
        )

        return self.contract.exec(
            self.sender,
            consts.FREEZER_SEND_CALL,
            args={'to': to},
            value=value,
            gas_limit=cast(int, dry.gas_consumed)
        )
