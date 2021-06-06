import consts

from configparser import ConfigParser, SectionProxy
from typing import Final


class Config:
    def __init__(self) -> None:
        parser = ConfigParser()
        parser.read(consts.CONFIG_FILE)
        self.polkadot: Final = Polkadot(parser["POLKADOT"])
        self.elrond: Final = Elrond(parser["ELROND"])


class Polkadot:
    def __init__(self, parser: SectionProxy):
        self.uri: Final = str(parser["NODE_URI"])


class Elrond:
    def __init__(self, parser: SectionProxy):
        self.uri: Final = str(parser["NODE_URI"])
        self.event_socket: Final = str(parser["EVENT_SOCK"])
        self.sender: Final = str(parser["SENDER_PEM"])
        self.project: Final = str(parser["MINT_PROJECT"])
