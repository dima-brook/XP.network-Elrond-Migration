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
        'erd1qqqqqqqqqqqqqpgqygvvtlty3v7cad507v5z793duw9jjmlxd8sszs8a2y',
    // Substrate Freezer Contract address
    xp_freezer: '5ESFqZ7xVxxfDgayqMH8ng14QyvR9V42VUqgQ6Z8yM4hyznX',
    // Workaround Elrond Event websocket
    elrond_ev_socket: "ws://localhost:3000"
};

export default config;
