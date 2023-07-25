const { ERROR_CODES: { VALIDATION, WRONG_TYPE, NOT_FOUND } } = require('./../../../../lib/etc/config');
const mockedDevice = require('./../../../fixtures/__mocks__/objects/device');
const mockedScenario = require('./../../../fixtures/__mocks__/objects/scenario');
const mockedThresholdTopics = require('./../../../fixtures/__mocks__/broker/thresholds');
const Homie = require('./../../../../lib/homie/Homie');

const Device = require('./../../../../lib/Device');
const Scenario = require('./../../../../lib/Scenario');
const HomieMigrator = require('./../../../../lib/homie/HomieMigrator');
const TestFactory = require('./../../../utils');

const factory = new TestFactory();

let homieMigrator;

jest.setTimeout(15000);

describe('HomieMigrator class', () => {
    afterAll(async () => {
        await factory.end();
    });

    test('POSITIVE: Create HomieMigrator instance', async () => {
        homieMigrator = new HomieMigrator({ homie: factory.homie });

        expect(!!homieMigrator).toBe(true);
    });

    test('NEGATIVE: Create HomieMigrator instance', async () => {
        let err;

        try {
            homieMigrator = new HomieMigrator();
        } catch (e) {
            err = e;
        }

        expect(!!err).toBe(true);

        try {
            homieMigrator = new HomieMigrator({ homie: null });
        } catch (e) {
            err = e;
        }

        expect(!!err).toBe(true);
    });

    test('POSITIVE: HomieMigrator initWorld', async () => {
        await homieMigrator.initWorld();

        expect(!!homieMigrator).toBe(true);
    });

    test('POSITIVE: attach device', async () => {
        homieMigrator.attachDevice(mockedDevice);

        await factory.sleep(100);

        const device = factory.homie.devices[mockedDevice.id];

        expect(!!device).toBe(true);
        expect(device instanceof Device).toBe(true);
        expect(device._isValid).toBe(true);
        expect(device._isAttached).toBe(true);
    });

    test('NEGATIVE: attach device', async () => {
        const invalidDevice = {
            ...mockedDevice,
            id : '-invalid-id-'
        };
        let err;

        try {
            homieMigrator.attachDevice(invalidDevice);
        } catch (e) {
            err = e;
        }

        expect(err.code).toBe(VALIDATION);
        expect(err.fields).toEqual({
            id : 'WRONG_FORMAT'
        });
    });

    test('POSITIVE: attach device that exists', async () => {
        let device = homieMigrator.homie.devices[mockedDevice.id];

        homieMigrator.attachDevice(mockedDevice);

        expect(device._isValid).toBe(true);
        expect(device._isAttached).toBe(true);

        await factory.sleep(100);

        device = homieMigrator.homie.devices[mockedDevice.id];

        expect(!!device).toBe(true);
        expect(device instanceof Device).toBe(true);
        expect(device._isValid).toBe(true);
        expect(device._isAttached).toBe(true);
    });

    test('POSITIVE: attach scenario', async () => {
        homieMigrator.attachScenario(mockedScenario);

        await factory.sleep(100);

        const scenario = factory.homie.scenarios[mockedScenario.id];

        expect(!!scenario).toBe(true);

        expect(Array.isArray(scenario.thresholds)).toBe(true);
        expect(scenario.thresholds.length).toEqual(1);
        expect(scenario.thresholds[0]._isValid).toBe(true);
        expect(scenario.thresholds[0]._isAttached).toBe(true);
        expect(scenario.thresholds[0]._homie instanceof Homie).toBe(true);

        expect(scenario instanceof Scenario).toBe(true);
        expect(scenario._isValid).toBe(true);
        expect(scenario._isAttached).toBe(true);
        expect(scenario._homie instanceof Homie).toBe(true);
    });

    test('POSITIVE: delete all scenario thresholds from broker', async () => {
        const scenarioId = 'scenario1';

        for (const topic in mockedThresholdTopics) {
            factory.publishToBroker(topic, mockedThresholdTopics[topic]);
        }

        await factory.sleep(100);

        let thresholds = factory.homie.getAllThresholds();

        expect(Array.isArray(thresholds[scenarioId])).toBe(true);

        homieMigrator.deleteThresholds(thresholds[scenarioId]);

        thresholds = factory.homie.getAllThresholds();

        expect(thresholds[scenarioId]).toEqual([]);
    });

    test('POSITIVE: delete node', (done) => {
        const deviceId = 'device-id';
        const nodeId = 'thermometer';
        const device = factory.homie.getDeviceById(deviceId);
        const node = device.getNodeById(nodeId);

        factory.homie.on('events.delete.success', payload => {
            // If don't receive target node payload in timeout then test will fail
            if (
                payload.type === 'NODE' &&
                payload.deviceId === deviceId &&
                payload.nodeId === nodeId
            ) done();
        });

        homieMigrator.deleteNode(node);
    });

    test('POSITIVE: delete device property (option)', (done) => {
        const deviceId = 'device-id';
        const propertyId = 'location';
        const device = factory.homie.getDeviceById(deviceId);
        const property = device.getOptionById(propertyId);

        factory.homie.on('events.delete.success', payload => {
            // If don't receive target property payload in timeout then test will fail
            if (
                payload.type === 'PROPERTY' &&
                payload.deviceId === deviceId &&
                payload.propertyId === propertyId
            ) done();
        });

        homieMigrator.deleteDeviceProperty(property);
    });

    test('POSITIVE: delete device property (telemetry)', (done) => {
        const deviceId = 'device-id';
        const propertyId = 'battery';
        const device = factory.homie.getDeviceById(deviceId);
        const property = device.getTelemetryById(propertyId);

        factory.homie.on('events.delete.success', payload => {
            // If don't receive target property payload in timeout then test will fail
            if (
                payload.type === 'PROPERTY' &&
                payload.deviceId === deviceId &&
                payload.propertyId === propertyId
            ) done();
        });

        homieMigrator.deleteDeviceProperty(property);
    });

    test('POSITIVE: delete scenario', (done) => {
        const scenario = factory.homie.getScenarioById(mockedScenario.id);

        factory.homie.on('events.delete.success', payload => {
        // If don't receive target scenario payload in timeout then test will fail
            if (
                payload.type === 'SCENARIO' &&
                payload.scenarioId === mockedScenario.id
            ) done();
        });

        homieMigrator.deleteScenario(scenario);
    });

    test('NEGATIVE: delete object that is not an instance of Node class', () => {
        const node = null;

        let err;

        try {
            homieMigrator.deleteNode(node);
        } catch (e) {
            err = e;
        }

        expect(err.code).toBe(WRONG_TYPE);
    });

    test('NEGATIVE: delete object that is not an instance of Property class', () => {
        const property = null;

        let err;

        try {
            homieMigrator.deleteDeviceProperty(property);
        } catch (e) {
            err = e;
        }

        expect(err.code).toBe(WRONG_TYPE);
    });

    test('POSITIVE: delete device', async () => {
        const deviceId = 'device-id';
        const device = factory.homie.getDeviceById(deviceId);

        homieMigrator.deleteDevice(device);

        // wait for a publish empty values to device topics to remove it
        await factory.sleep(200);

        expect(factory.homie.getDevices()[deviceId]).toBe(undefined);
    });

    test('NEGATIVE: delete object that is not an instance of Device class', () => {
        const device = null;

        let err;

        try {
            homieMigrator.deleteDevice(device);
        } catch (e) {
            err = e;
        }

        expect(err.code).toBe(WRONG_TYPE);
    });

    test('POSITIVE: initializeEntityClass and destroyEntityClass', async () => {
        const homie = factory.homie;
        const handler = (data) => {
            factory.publishToBroker('response/bridge-types/republish', JSON.stringify(data), { retain: false });
        };

        try {
            await new Promise((resolve, reject) => {
                homie.transport.subscribe('request/bridge-types/#', (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
            homie.on('request.BRIDGE_TYPES.republish', handler);
            homieMigrator.initializeEntityClass('BRIDGE_TYPES');
            homieMigrator.destroyEntityClass('BRIDGE_TYPES');

            homie.off('request.BRIDGE_TYPES.republish', handler);
            await new Promise((resolve, reject) => {
                homie.transport.unsubscribe('request/bridge-types/#', (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
        } catch (e) {
            console.log(e);
            throw e;
        }
    });

    test('POSITIVE: HomieMigrator attachEntity BRIDGE_TYPES', async () => {
        homieMigrator.initializeEntityClass('BRIDGE_TYPES');

        const entity = await homieMigrator.attachEntity('BRIDGE_TYPES', {
            id            : '111',
            title         : 'title',
            configuration : '{}',
            icon          : 'icon/path',
            status        : 'pulled',
            state         : 'pulled'
        });

        expect(!!entity).toBe(true);
        expect(!!homieMigrator.homie.entities.BRIDGE_TYPES['111']).toBe(true);

        homieMigrator.destroyEntityClass('BRIDGE_TYPES');
    });

    test('NEGATIVE: HomieMigrator attachEntity wrong type', async () => {
        try {
            await homieMigrator.attachEntity('WRONG', {});
        } catch (e) {
            expect(e.code).toBe(NOT_FOUND);
        }
    });

    test('NEGATIVE: HomieMigrator attachNodes wrong type', async () => {
        try {
            homieMigrator.attachNodes(null, []);
        } catch (e) {
            expect(e.code).toBe(WRONG_TYPE);
        }
    });

    test('NEGATIVE: HomieMigrator attachProperties wrong type', async () => {
        try {
            homieMigrator.attachProperties(null, []);
        } catch (e) {
            expect(e.code).toBe(WRONG_TYPE);
        }
    });

    test('NEGATIVE: HomieMigrator deleteThresholds wrong type', async () => {
        try {
            homieMigrator.deleteThresholds();
        } catch (e) {
            expect(e.code).toBe(WRONG_TYPE);
        }

        try {
            homieMigrator.deleteThresholds([ null ]);
        } catch (e) {
            expect(e.code).toBe(WRONG_TYPE);
        }
    });

    test('POSITIVE: HomieMigrator deleteEntity BRIDGE_TYPES', async () => {
        homieMigrator.initializeEntityClass('BRIDGE_TYPES');

        const entity = await homieMigrator.attachEntity('BRIDGE_TYPES', {
            id            : '111',
            title         : 'title',
            configuration : '{}',
            icon          : 'icon/path',
            status        : 'pulled',
            state         : 'pulled'
        });

        try {
            await homieMigrator.deleteEntity();
        } catch (e) {
            expect(e.code).toBe(WRONG_TYPE);
        }

        await homieMigrator.deleteEntity(entity);

        expect(entity._isValid).toBe(false);

        homieMigrator.destroyEntityClass('BRIDGE_TYPES');
    });
});
