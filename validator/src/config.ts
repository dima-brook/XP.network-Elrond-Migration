const config = {
    // Substrate Node Uri
    xnode: 'ws://localhost:9944',
    // Elrond Node Proxy Uri
    elrond_node: 'http://localhost:7950',
    // Private Key File
    private_key:
        '../XP.network-Elrond-Migration/elrond-mint-contract/wallets/users/alice.pem',
    // Elrond Address (TODO: Derive from pk automatically)
    elrond_sender:
        'erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th',
    // Elrond minter contract address
    elrond_minter:
        'erd1qqqqqqqqqqqqqpgqfzydqmdw7m2vazsp6u5p95yxz76t2p9rd8ss0zp9ts',
    // Substrate Freezer Contract address
    xp_freezer: '5HnjRGMx1qcGC7ASLWDFspbLvHdb79NtaNfEPHBgxcDWi5gB',
    // Workaround Elrond Event websocket
    elrond_ev_socket: "ws://localhost:3000"
};

export default config;
