const config = {
    // Substrate Node Uri
    "xnode": "ws://localhost:9944",
    // Elrond Node Proxy Uri
    "elrond_node": "http://127.0.0.1:7950",
    // Private Key File
    "private_key": "../elrond-mint-contract/wallets/users/alice.pem",
    // Elrond Address (TODO: Derive from pk automatically)
    "elrond_sender": "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th",
    // Elrond minter contract address
    "elrond_minter": "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th",
    // Substrate Freezer Contract address
    "xp_freezer": "5FqhLfbiQR7MH8gJq9ix9qEky7gbGsaJbg6GoowhoACY45rk"
};

export default config;