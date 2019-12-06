class ChannelMessage {
    constructor(to, messageAsObj){
        this.recipient = to;
        this.message = JSON.stringify(messageAsObj);
    }
}

module.exports = ChannelMessage;