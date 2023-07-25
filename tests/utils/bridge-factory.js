const EventEmitter = require('events');

const BaseBridge = require('./../../lib/Bridge');
const BaseDeviceBridge = require('./../../lib/Bridge/Device');
const BaseNodeBridge = require('./../../lib/Bridge/Node');
const BasePropertyBridge = require('./../../lib/Bridge/Property');
const BasePropertyTransport = require('./../../lib/Bridge/Property/transport');
const BaseParser = require('./../../lib/Bridge/Parser');
const BridgesManager = require('./../../lib/Bridge/cloud/BridgesManager');

class RandomNumberTransport extends BasePropertyTransport {
    constructor(config) {
        super({ ...config, type: 'random_number', pollInterval: 5000 });
        this.handleConnected = this.handleConnected.bind(this);
        this.handleDisconnected = this.handleDisconnected.bind(this);
    }
    async get() {
        return Math.ceil(Math.random() * 10);
    }
    async set() {
        throw new Error('Cannot set');
    }
    attachBridge(bridge) {
        super.attachBridge(bridge);
        // do some handshake staff with bridge here
        this.bridge.connection.on('connected', this.handleConnected);
        this.bridge.connection.on('disconnected', this.handleDisconnected);
    }
    detachBridge() {
        // do some reverse-handshake staff with bridge here
        this.bridge.connection.off('connected', this.handleConnected);
        this.bridge.connection.off('disconnected', this.handleDisconnected);
        super.detachBridge();
    }
    async handleConnected() {
        this.enablePolling();
    }
    async handleDisconnected() {
        this.disablePolling();
    }
}
class ErroredTransport extends BasePropertyTransport {
    constructor(config) {
        super({ ...config, type: 'errored', pollInterval: 5000 });
    }
    async get() {
        throw new Error('Cannot get');
    }
    async set() {
        throw new Error('Cannot set');
    }
}
class MyParserMultiplier extends BaseParser {
    constructor() {
        super({ type: 'myparsermultiplier', homieDataType: 'string' });
    }
    // because results will be applied as // transport.set(...parser.fromHomie(homieValue))
    fromHomie(data) {
        return [ Math.round(data / 10) ];
    }
    toHomie(data) {
        return `${data * 10}`;
    }
}
class CustomConnection extends EventEmitter {
    constructor() {
        super();
    }
    connect() {
        console.log('CONNECTED'); this.emit('connected');
    }
    disconnect() {
        console.log('DISCONNECTED'); this.emit('disconnected');
    }
}

class Bridge extends BaseBridge {
    constructor(config) {
        super({ ...config, device: null, rootTopic: 'custom-root-topic' });
        this.connection = config.connection;
        if (config.device) this.setDeviceBridge(config.device);
    }
}
class DeviceBridge extends BaseDeviceBridge {
    constructor(config, { debug } = {}) {
        super(config, { debug });
        this.handleConnected = this.handleConnected.bind(this);
        this.handleDisconnected = this.handleDisconnected.bind(this);
    }
    attachBridge(bridge) {
        super.attachBridge(bridge);
        // do some handshake staff with bridge here
        this.bridge.connection.on('connected', this.handleConnected);
        this.bridge.connection.on('disconnected', this.handleDisconnected);
    }
    detachBridge() {
        // do some reverse-handshake staff with bridge here
        this.bridge.connection.off('connected', this.handleConnected);
        this.bridge.connection.off('disconnected', this.handleDisconnected);
        super.detachBridge();
    }
    async handleConnected() {
        this.connected = true;
    }
    async handleDisconnected() {
        this.connected = false;
    }
}
class NodeBridge extends BaseNodeBridge {
    constructor(config, { debug } = {}) {
        super(config, { debug });
        this.handleConnected = this.handleConnected.bind(this);
        this.handleDisconnected = this.handleDisconnected.bind(this);
    }
    attachBridge(bridge) {
        super.attachBridge(bridge);
        // do some handshake staff with bridge here
        this.bridge.connection.on('connected', this.handleConnected);
        this.bridge.connection.on('disconnected', this.handleDisconnected);
    }
    detachBridge() {
        // do some reverse-handshake staff with bridge here
        this.bridge.connection.off('connected', this.handleConnected);
        this.bridge.connection.off('disconnected', this.handleDisconnected);
        super.detachBridge();
    }
    async handleConnected() {
        this.connected = true;
    }
    async handleDisconnected() {
        this.connected = false;
    }
}
class PropertyBridge extends BasePropertyBridge {
    constructor(config, { type, transport, parser, debug }) {
        super(config, { type, transport, parser, debug });
    }
}

module.exports = {
    RandomNumberTransport,
    ErroredTransport,
    MyParserMultiplier,
    CustomConnection,
    Bridge,
    DeviceBridge,
    NodeBridge,
    PropertyBridge,
    BaseBridge,
    BaseDeviceBridge,
    BaseNodeBridge,
    BasePropertyBridge,
    BasePropertyTransport,
    BaseParser,
    BridgesManager
};
