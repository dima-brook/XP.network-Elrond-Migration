from elrond import ElrondHelper
from config import Config


def main() -> None:
    config = Config()
    elrd = ElrondHelper(config.elrond.uri,
                        config.elrond.sender,
                        config.elrond.project)

    print("ELROND SETUP")
    print("Issuing esdt...")
    print(f"Issued esdt: {elrd.prepare_esdt()}")

    print("deplyoing minter...")
    print(f"deployed contract: {elrd.deploy_sc().bech32()}")

    print("setting up contract perms...")
    print(f"perm setup done! tx: {elrd.setup_sc_perms().hash}")


if __name__ == "__main__":
    main()
