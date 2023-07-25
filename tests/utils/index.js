/* istanbul ignore file */
/* eslint-disable guard-for-in */
/* eslint-disable more/no-duplicated-chains */
const MQTTTransport = require('./../../lib/Broker/mqtt');
const Homie = require('./../../lib/homie/Homie');
const mockedBroker = require('./../fixtures/__mocks__/broker/full');
const bridgeFactory = require('./bridge-factory');

class TestFactory {
    constructor() {
        const uri = process.env.ENV_MODE === 'test' ? 'mqtt://emqx-emqx:1883' : 'mqtt://127.0.0.1:1883';
        const username = process.env.MQTT_USER || '';
        const password = process.env.MQTT_PASS || '';

        this.mqttConnection = { uri, username, password };

        this.rootTopic = 'custom-root-topic';

        this.transport = new MQTTTransport({ ...this.mqttConnection, retain: false });
        this.homie = new Homie({ transport: this.transport, rootTopic: this.rootTopic });
        this.bridgeFactory = bridgeFactory;
    }

    async init() {
        await this.homie.init();
    }

    publishState() {
        if (!this.transport) return;

        for (const topic in mockedBroker) {
            this.publishToBroker(topic, mockedBroker[topic]);
        }
    }

    publishToBroker(topic, value, options = {}) {
        this.homie.publishToBroker(topic, value, { retain: false, ...options });
    }

    async sleep(ms) {
        return new Promise((resolve) => setTimeout(() => {
            resolve(true);
        }, ms));
    }

    async end() {
        await new Promise((resolve) => {
            this.transport.end(false, () => {
                resolve();
            });
        });
    }
}

module.exports = TestFactory;
