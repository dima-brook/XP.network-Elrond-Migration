const config = {
    // Substrate Node Uri
    xnode: 'ws://localhost:9944',
    // Elrond Node Proxy Uri
    elrond_node: 'http://localhost:7950',
    // Private Key File
    private_key:
        '../elrond-mint-contract/wallets/users/alice.pem',
    // Elrond Address (TODO: Derive from pk automatically)
    elrond_sender:
        'erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th',
    // Elrond minter contract address
    elrond_minter:
        'erd1qqqqqqqqqqqqqpgqg3rhq4rucjhnnxk6zhantd3yuh8v9m5cd8ssp73zh7',
    // Substrate Freezer Contract address
    xp_freezer: '5ESFqZ7xVxxfDgayqMH8ng14QyvR9V42VUqgQ6Z8yM4hyznX',
};

export default config;
