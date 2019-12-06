const {
    MemoryAccount,
    Channel,
    Crypto,
    Universal,
    Wallet,
    TxBuilder,
    Aepp,
    Node
} = require('@aeternity/aepp-sdk');

//const Aepp = require('@aeternity/aepp-sdk/es/ae/aepp').default;

const {
    API_URL,
    INTERNAL_API_URL,
    STATE_CHANNEL_URL,
    NETWORK_ID,
    RESPONDER_HOST,
    RESPONDER_PORT
} = require('./config/nodeConfig');

const amounts = require('./config/stateChannelConfig').amounts;

const publicKey = require('./config/keyPair').publicKey;

const aeWeb = {
    crypto: Crypto,
    channel: Channel,
    universal: Universal,
    wallet: Wallet,
    memoryAccount: MemoryAccount,
    txBuilder: TxBuilder,
    aepp: Aepp,
    node: Node,
    config: {
        responderAddress: publicKey,
        node: {
            STATE_CHANNEL_URL,
            RESPONDER_HOST,
            RESPONDER_PORT,
            API_URL,
            INTERNAL_API_URL,
            NETWORK_ID
        },
        amounts: amounts
    }
}

module.exports = aeWeb;