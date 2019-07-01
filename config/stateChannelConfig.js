
const keyPair = require('./keyPair');
const nodeConfig = require('./nodeConfig');

const ONE_AE = 1000000000000000000;
             
const MINIMUM_DEPOSIT = ONE_AE;
const channelReserve =  MINIMUM_DEPOSIT ; //  / 10;


module.exports = {
    params: {
        // Public key of initiator
        // (in this case `initiatorAddress` defined earlier)
        initiatorId: '',
        // Public key of responder
        // (in this case `responderAddress` defined earlier)
        responderId: keyPair.publicKey,
        // Initial deposit in favour of the responder by the initiator
        pushAmount: 3,
        // Amount of tokens initiator will deposit into state channel
        initiatorAmount: MINIMUM_DEPOSIT,
        // Amount of tokens responder will deposit into state channel
        responderAmount: MINIMUM_DEPOSIT,
        // Minimum amount both peers need to maintain
        channelReserve: channelReserve,
        // Minimum block height to include the channel_create_tx
        ttl: 0,
        // Amount of blocks for disputing a solo close
        lockPeriod: 10,
        // Host of the responder's node
        host: nodeConfig.RESPONDER_HOST,
        // Port of the responders node
        port: nodeConfig.RESPONDER_PORT,
        //baseUrl: nodeConfig.API_URL
        //fee: 1000,
        //nonce: 1000
    },
    amounts :{
        deposit: MINIMUM_DEPOSIT,
        reserve: channelReserve
    }
}