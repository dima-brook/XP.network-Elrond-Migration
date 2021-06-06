CONFIG_FILE: str = "config.ini"

# Elrond stuff
ELROND_ESDT_VALUE = 5000000000000000000
ELROND_ESDT_SC_ADDR = "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqzllls8a5w6u"  # noqa: E501
ELROND_GAS_PRICE = 1000000000
ELROND_ESDT_GASL = 800000000
ELROND_ESDT_ISSUE_DATA = "issue@58504454@58504454@03E8@06@63616E4D696E74@74727565@63616E4275726E@74727565@63616E4368616E67654F776E6572@74727565"  # noqa: E501
ELROND_TX_URI = "http://127.0.0.1:7950/transaction/{}?withResults=true"
ELROND_CONTRACT_ARGS = "0x{esdt} 1 0x{sender}"
ELROND_SETROLE_DATA = "setSpecialRole@${esdt}@${sc_addr}@45534454526F6C654C6F63616C4D696E74@45534454526F6C654C6F63616C4275726E"  # noqa: E501
