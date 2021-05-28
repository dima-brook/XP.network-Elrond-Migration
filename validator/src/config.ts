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
        'erd1qqqqqqqqqqqqqpgqt5w9vlsdcmu5t5wvzdj8xnp42kqm4x3ud8ssrk9q8s',
    // Substrate Freezer Contract address
    xp_freezer: '5HdvamL8whamAX7xoX6yE7sFf5g6NuqoGHPEq8NnXa4P7Kz6',
    // Workaround Elrond Event websocket
    elrond_ev_socket: "ws://localhost:3000"
};

export default config;
