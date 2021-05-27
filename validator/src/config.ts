const config = {
    // Substrate Node Uri
    xnode: 'ws://localhost:9944',
    // Elrond Node Proxy Uri
    elrond_node: 'http://localhost:7950',
    // Private Key File
    private_key:
        '5b4a6f14ab74ba7ca23db6847e28447f0e6a7724ba9664cf425df707a84f5a8b',
    // Elrond Address (TODO: Derive from pk automatically)
    elrond_sender:
        'erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th',
    // Elrond minter contract address
    elrond_minter:
        'erd1qqqqqqqqqqqqqpgqlz32muzjtu40pp9lapy35n0cvrdxll47d8ss9ne0ta',
    // Substrate Freezer Contract address
    xp_freezer: '5ESFqZ7xVxxfDgayqMH8ng14QyvR9V42VUqgQ6Z8yM4hyznX',
};

export default config;
