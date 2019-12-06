const {
    Channel,
    Crypto,
    Universal,
    TxBuilder,
    Chain,
    MemoryAccount,
    Node
} = require('@aeternity/aepp-sdk');

const {
    API_URL,
    INTERNAL_API_URL,
    STATE_CHANNEL_URL,
    NETWORK_ID,
    COMPILER_URL
} = require('./../config/nodeConfig');

const amounts = require('./../config/stateChannelConfig').amounts;

const keyPair = require('./../config/keyPair');
const products = require('./../config/products');
const ChannelMessage = require('./../utils/index').ChannelMessage;

let SHOW_DEBUG_INFO = true;

const messageQueue = [];

function log() {
    if (SHOW_DEBUG_INFO) {
        for (let arg in arguments) {
            console.log(`${new Date()} | ${JSON.stringify(arguments[arg], null, 2)}`);
        }

        console.log();
    }
}

const FUND_AMOUNT = amounts.deposit * 6; // 1 AE * 6 = 6 AE

let openChannels = new Map();

async function createAccount (keyPair) {

    let node = await Node({
        url: API_URL,
        internalUrl: INTERNAL_API_URL,
        forceCompatibility: true
    })

    let client = await Universal({
        nodes: [{
            name: 'ANY_NAME',
            instance: node
        }],
        accounts: [MemoryAccount({
            keypair: keyPair
        })],
        nativeMode: true,
        networkId: NETWORK_ID,
        compilerUrl: COMPILER_URL,
        forceCompatibility: true
    })

    return client;
}

let account;

(async function () {

    log(`'NETWORK_ID: ${ NETWORK_ID }`);
    
    account = await createAccount(keyPair);
})()

async function createChannel(req, res) {

    let params = req.body.params;

    let channel = await connectAsResponder(params);

    let data = {
        channel,
        round: 1,
        product: {
            name: '',
            price: 0
        },
        isSigned: true,
        boughtProducts: 0
    }

    openChannels.set(params.initiatorId, data);

    let info = {
        name: 'DEPOSIT',
        amount: params.initiatorAmount,
        message: 'State channel is successfully created!'
    }

    let message = new ChannelMessage(params.initiatorId, info);
    messageQueue.push(message);

    channelActions(channel);

    res.send('ok');
}

async function buyProduct(req, res) {
    
    let initiatorAddress = req.body.initiatorAddress;
    let productName = req.body.productName;

    let productPrice = products[productName];
    let data = openChannels.get(initiatorAddress);

    log(`[BUY] round: ${data.round}, module: ${data.round % 5}`, data);
    log('[BUY][INFO] request body:', req.body);
    log('[BUY][INFO] initiator address:', initiatorAddress);
    log('[BUY][INFO] product name:', productName);
    log('[BUY][INFO] product price:', productPrice);

    if (!productName) {
        productName = 'espresso';
    }

    if(!productPrice) {
        productPrice = 500000000000000000;
    }

    if (productPrice && data ) { // && data.isSigned

        data.boughtProducts++;

        if(data.boughtProducts % 5 === 0) {
            productPrice = 0;
        }

        data.round++;
        data.product = {
            name: productName,
            price: productPrice
        }
        data.isSigned = false;
        
        getOffChainBalances(data.channel);

        openChannels[initiatorAddress] = data;

        res.send({
            price: productPrice
        });  
    } else {
        console.log('[ERROR] buyProduct')
        res.status(404);
        res.end();
    }
}

function stopChannel(req, res) {

    log('[CLOSE] request body', req.body);

    let initiatorAddress = req.body.initiatorAddress;
    let result = openChannels.delete(initiatorAddress);

    res.send(result);
}

async function faucet(req, res) {

    let pubKey = req.query.pubKey;
    if(!pubKey) {
        res.send({
            success: false,
            message: `Invalid public key!`
        });

        return;
    }

    let balanceOfInitiator = 0;
    try {
        balanceOfInitiator = await account.balance(pubKey);
        let responderBalance = await account.balance(keyPair.publicKey);
        
        log(`[BACK-END] balance: ${ responderBalance / amounts.deposit }`);
    } catch (error) {
        console.log('[ERROR]');
        console.log(error.message || error);
        console.log();
    }

    try {

        if(balanceOfInitiator >= FUND_AMOUNT) {
            res.send({
                success: true,
                message: `[FAUCET] Public key: '${pubKey}' has enough aettos to open a channel: ${balanceOfInitiator} aettos.`
            });
        } else {
            let result = await account.spend(FUND_AMOUNT, pubKey);
            
            log(`[FAUCET] ${ result }`)
            res.send({
                success: true,
                message: `[FAUCET] Public key: '${pubKey}' is funded with ${FUND_AMOUNT} aettos.`
            });
        }

        
    } catch (error) {

        log(`[ERROR] [FAUCET]`, error);

        res.send({
            success: false,
            message: `Something went wrong, cannot fund this public key. For more info look at terminal!`
        });
    }
}

// function showLogs (req, res) {
//     console.log(req.body);
//     SHOW_DEBUG_INFO = req.body.showLogs;

//     res.send(`Show debug logs have been changed to: ${ SHOW_DEBUG_INFO }`);
// }

// function shouldShowLogs (req, res) {
//     res.send({ show: SHOW_DEBUG_INFO})
// }

// HELPERS

// connect as responder or initiator 
async function connectAsResponder(params) {

    const TIMEOUT = 1000 * 60 * 20;

    const _params = {
        ...params,
        url: STATE_CHANNEL_URL,
        role: 'responder',
        sign: responderSign,
        minimum_depth: 0,

        // timeout_accept : TIMEOUT,
        // timeout_funding_lock : TIMEOUT,
        // timeout_awaiting_locked : TIMEOUT,
        // timer_funding_lock: TIMEOUT,
        // timeout_idle: TIMEOUT,
        // timeout_funding_create: TIMEOUT,
        // timeout_sign: TIMEOUT,

        //timeout_awaiting_open: TIMEOUT,
        // timeout_idle: TIMEOUT,
    };

    log('[PARAMS]', _params);

    return await Channel(_params);
}

async function responderSign(tag, tx, additionalParam) {
    log('[SIGN] responder');

    if(tag === 'deposit_ack') {

        // log(`[deposit_ack]`, tx);
        return account.signTransaction(tx)
    }

    // Deserialize binary transaction so we can inspect it
    let txData = deserializeTx(tx);

    tag = txData.txType;

    log(`[TAG] ${ tag }`);

    if (tag === 'responder_sign' || tag === 'CHANNEL_CREATE_TX' || tag === 'channelCreate') {
        //log(txData);
        return account.signTransaction(tx)
    }

    // When someone wants to transfer a tokens we will receive
    // a sign request with `update_ack` tag
    if (tag === 'channelOffChain' || tag === 'update_ack' || tag === 'CHANNEL_OFFCHAIN_TX' || tag === 'CHANNEL_OFFCHAIN_UPDATE_TRANSFER') {


        //log(txData);

        let isValid = isTxValid(txData, additionalParam.updates);
        if (!isValid) {
            // TODO: challenge/dispute
            // log('[ERROR] transaction is not valid');
        }

        // Check if update contains only one offchain transaction
        // and sender is initiator
        if (txData.tag === 'CHANNEL_OFFCHAIN_TX' || true) { //  && isValid
            sendConfirmMsg(txData, additionalParam.updates);
            return account.signTransaction(tx);
        }
    }

    if (tag === 'channelCloseMutual' || tag === 'shutdown_sign_ack' || tag === 'CHANNEL_CLOSE_MUTUAL_TX') { 
        return account.signTransaction(tx);
    }

    console.log('[ERROR] ==> THERE IS NO SUITABLE CASE TO SIGN', txData);
}

function channelActions(channel) {

    channel.on('statusChanged', (status) => {

        log(`[STATUS] ${status.toUpperCase()}`);

        if (status.toUpperCase() === 'OPEN') {
            while(messageQueue.length > 0){
                let msg = messageQueue.shift();
                channel.sendMessage(msg.message, msg.recipient);
            }
        }
    });
}

function isTxValid(txData, updates) {

    if(!updates) {
        console.log('Missing updates!');
        return false;
    }

    let lastUpdateIndex = updates.length - 1;
    if (lastUpdateIndex < 0) {
        log('[TX_VALIDATION] ==> last index is smaller than 0')
        return false;
    }

    let lastUpdate = updates[lastUpdateIndex];
    let data = openChannels.get(lastUpdate.from);
    if (!data) {
        log('[TX_VALIDATION] ==> no data <==')
        return false;
    }

    let isRoundValid = data.round === txData.round;
    let isPriceValid = data.product.price === updates[lastUpdateIndex].amount;
    let isValid = isRoundValid && isPriceValid;

    if(!isRoundValid) {
        log('[TX_VALIDATION] ==> invalid round <==');
    }

    if (!isPriceValid) {
        log('[TX_VALIDATION] ==> invalid price <==');
    }

    if (isValid) {
        openChannels[lastUpdate.from].isSigned = true;
    }

    return isValid;
}

function sendConfirmMsg(txData, updates) {

    let from = updates[updates.length - 1].from;
        let data = openChannels.get(from);
        // console.log('====>', data)
        let msg = `[OFF_CHAIN] Successfully bought ${data.product.name} for ${data.product.price} aettos.`;
    
        let dataInfo = {
            name: data.product.name,
            amount: data.product.price,
            message: msg,
            isNextFree : (data.boughtProducts + 1) % 5 === 0
        }
    
        data.channel.sendMessage(JSON.stringify(dataInfo), from);
}

function deserializeTx(tx) {
    return TxBuilder.unpackTx(tx);
}

function getOffChainBalances(channel) {
    // off chain balances
    channel.balances([ keyPair.publicKey ])
        .then(function (balances) {
            log('[INFO] off chain balance', `[INFO] host: ${ balances[keyPair.publicKey] }`);
        }).catch(e => console.log(e))
}

module.exports = {
    get: {
        faucet,
        // shouldShowLogs
    },
    post: {
        createChannel,
        buyProduct,
        stopChannel,
        // showLogs
    }
}

