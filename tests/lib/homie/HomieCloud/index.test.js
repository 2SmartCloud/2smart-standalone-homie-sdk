/* eslint-disable more/no-numeric-endings-for-variables */
const Homie = require('./../../../../lib/homie/Homie');
const HomieCloud = require('./../../../../lib/homie/HomieCloud');
const Device = require('./../../../../lib/Device');

const cloudState = require('./../../../fixtures/__mocks__/broker/cloud-state');

const TestFactory = require('./../../../utils');

const factory = new TestFactory();
let homieCloud;

jest.setTimeout(15000);

describe('HomieCloud class', () => {
    afterAll(async () => {
        await factory.end();
    });

    test('POSITIVE: Create HomieCloud instance', async () => {
        homieCloud = new HomieCloud({ transport: factory.transport });

        expect(!!homieCloud).toBe(true);
    });

    test('NEGATIVE: Create HomieCloud instance', async () => {
        let err;

        try {
            homieCloud = new HomieCloud();
        } catch (e) {
            err = e;
        }

        expect(!!err).toBe(true);

        try {
            homieCloud = new HomieCloud({ transport: null });
        } catch (e) {
            err = e;
        }

        expect(!!err).toBe(true);
    });

    test('POSITIVE: HomieCloud.init()', async () => {
        await homieCloud.init();

        expect(!!homieCloud).toBe(true);
    });

    test('POSITIVE: HomieCloud.createNewHomie()', async () => {
        const rootTopic = 'test-root-topic';
        const homie = homieCloud.createNewHomie(rootTopic);

        expect(homie instanceof Homie).toBe(true);
        expect(homieCloud.store[rootTopic] instanceof Homie).toBe(true);
    });

    test('POSITIVE: HomieCloud handle multiple publish', async () => {
        for (const topic in cloudState) {
            factory.transport.publish(topic, cloudState[topic], { retain: false });
        }

        await factory.sleep(1000);

        const user1 = 'user-hash-1';
        const user2 = 'user-hash-2';
        const deviceId = 'test-device';

        const homieUser1 = homieCloud.store[user1];
        const homieUser2 = homieCloud.store[user2];

        expect(homieUser1 instanceof Homie).toBe(true);
        expect(homieUser2 instanceof Homie).toBe(true);

        const deviceUser1 = homieUser1.getDeviceById(deviceId);
        const deviceUser2 = homieUser2.getDeviceById(deviceId);

        expect(deviceUser1 instanceof Device).toBe(true);
        expect(deviceUser2 instanceof Device).toBe(true);
    });
});
