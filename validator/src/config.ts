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
        'erd1qqqqqqqqqqqqqpgqj5zftf3ef3gqm3gklcetpmxwg43rh8z2d8ss2e49aq',
    // Substrate Freezer Contract address
    xp_freezer: '5D1KKio8KxaqwmeQM5vu4yrUyDWDaEs6v3DzkWVpfADmYgPt',
    // Workaround Elrond Event websocket
    elrond_ev_socket: "ws://localhost:3000"
};

export default config;
