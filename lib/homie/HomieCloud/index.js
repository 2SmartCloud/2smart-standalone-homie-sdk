/* istanbul ignore file */
const EventEmitter = require('events');
const CloudTransport = require('../../Broker/cloud-mqtt');
const X = require('./../../utils/X');
const Homie = require('./../Homie');
const { ERROR_CODES: { REQUIRED } } = require('./../../etc/config');
const EventCache = require('./../../utils/EventCache');

class HomieCloud extends EventEmitter {
    constructor({ transport, debug }) {
        if (!transport) {
            throw new X({
                code    : REQUIRED,
                fields  : {},
                message : 'Transport is required'
            });
        }

        super();

        this.handleMessage = this.handleMessage.bind(this);
        this.handleError = this.handleError.bind(this);
        this._dataHandler = this._dataHandler.bind(this);

        this.transport = transport;
        this.store = {};
        this.debug = debug;
        this.eventCache = new EventCache({
            handler      : this._dataHandler,
            debounceTime : 100,
            cacheSize    : 20000
        });
    }

    async init() {
        this.transport.on('message', this.handleMessage);

        await this.transport.connect();
        await new Promise((resolve, reject) => {
            this.transport.subscribe('#', (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    async _dataHandler(chunk) {
        for (const topic in chunk) {
            const msg = chunk[topic];
            const rootTopic = topic.split('/')[0];

            if (!this.store[rootTopic]) this.createNewHomie(rootTopic);

            const homie = this.getHomieByRootTopic(rootTopic);

            homie.transport.handleMessage(topic, msg);
        }
    }

    handleMessage(topic, msg) {
        this.eventCache.push({ type: 'ADD_EVENT', data: { topic, msg } });
    }

    handleError(error) {
        this.emit('error', error);
    }

    createNewHomie(rootTopic) {
        const homie = new Homie({
            transport : new CloudTransport({
                transport : this.transport,
                debug     : this.debug,
                rootTopic
            })
        });

        homie.on('error', this.handleError);

        this.store[rootTopic] = homie;
        this.emit('new_homie', rootTopic, homie);

        homie.initCloudInstance();

        // messages is being handled by HomieCloud.handleMessage method
        // to prevent doubled messages, remove default handler from transport
        homie.transport.disableDefaultMessageHandler();

        return homie;
    }

    async initNewHomie(rootTopic) {
        return this.getHomieByRootTopic(rootTopic);
    }

    getHomieByRootTopic(rootTopic) {
        return this.store[rootTopic];
    }
}

module.exports = HomieCloud;
