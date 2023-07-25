const brokerDevice = require('./../../../fixtures/__mocks__/broker/device');
const newScenario = require('./../../../fixtures/__mocks__/broker/new_scenario');
const groupsOfProperties = require('./../../../fixtures/__mocks__/broker/groups-of-properties');
const HomieServer = require('./../../../../lib/homie/HomieServer');
const Device = require('./../../../../lib/Device');
const Scenario = require('./../../../../lib/Scenario');
const TestFactory = require('./../../../utils');

const factory = new TestFactory();

let homieServer;

jest.setTimeout(15000);

describe('HomieServer class', () => {
    afterAll(async () => {
        await factory.end();
    });

    test('POSITIVE: Create HomieServer instance', async () => {
        homieServer = new HomieServer({ homie: factory.homie });

        expect(!!homieServer).toBe(true);
    });

    test('NEGATIVE: Create HomieServer instance', async () => {
        let err;

        try {
            homieServer = new HomieServer();
        } catch (e) {
            err = e;
        }

        expect(!!err).toBe(true);

        try {
            homieServer = new HomieServer({ homie: null });
        } catch (e) {
            err = e;
        }

        expect(!!err).toBe(true);
    });

    test('POSITIVE: HomieServer initWorld', async () => {
        await homieServer.initWorld();

        factory.publishState();

        await factory.sleep(1000);

        expect(!!Object.keys(homieServer.getDevices())).toBe(true);
    });


    test('POSITIVE: get list of Devices from broker', async () => {
        const devices = homieServer.getDevices();

        expect(typeof devices).toBe('object');
        expect(devices['test-device'] instanceof Device).toBe(true);
    });

    test('POSITIVE: get device by id', async () => {
        const device = homieServer.getDeviceById('test-device');

        expect(device instanceof Device).toBe(true);
    });

    test('NEGATIVE: get device by id', async () => {
        let err;

        try {
            homieServer.getDeviceById('fail');
        } catch (e) {
            err = e;
        }

        expect(err.fields).toEqual({ device: 'NOT_FOUND' });
    });

    test('POSITIVE: HomieServer onNewDeviceAdded', async () => {
        let res;

        homieServer.onNewDeviceAdded(data => res = data);

        for (const topic in brokerDevice) {
            factory.publishToBroker(topic, brokerDevice[topic]);
        }

        await factory.sleep(100);

        expect(res).toEqual({ deviceId: 'test-device-2' });

        const device = homieServer.getDeviceById('test-device-2');

        expect(device instanceof Device).toBe(true);
    });

    test('POSITIVE: HomieServer heartbeat', async () => {
        let res;
        const device = homieServer.getDeviceById('test-device-2');

        device.onHeartbeat(data => {
            res = data;
            device.respondToHeartbeat(data);
        });

        factory.homie.publishToBroker('sweet-home/test-device-2/$heartbeat/set', 'ping');

        await factory.sleep(100);

        expect(!!res).toBe(true);
    });

    test('POSITIVE: HomieServer onDelete device', async () => {
        let res;

        homieServer.onDelete(data => res = data);

        Object.keys(brokerDevice).forEach(topic => {
            factory.publishToBroker(topic, '');
        });

        await factory.sleep(100);

        expect(res).toMatchObject({
            type     : 'DEVICE',
            deviceId : 'test-device-2'
        });
    });

    test('POSITIVE: HomieServer getEntities', async () => {
        for (const topic in groupsOfProperties) {
            factory.publishToBroker(topic, groupsOfProperties[topic]);
        }

        await factory.sleep(100);

        let list = homieServer.getEntities();

        expect(list).toEqual({});

        list = homieServer.getEntities('GROUP_OF_PROPERTIES');

        expect(!!Object.keys(list)).toBe(true);
    });

    test('POSITIVE: HomieServer getEntityById', async () => {
        const res = homieServer.getEntityById('GROUP_OF_PROPERTIES', 'test-1');

        expect(!!res).toBe(true);
        expect(res._isAttached).toBe(true);
    });

    test('POSITIVE: HomieServer onDeleteRequest', async () => {
        let res;

        homieServer.onDeleteRequest(data => res = data);

        factory.publishToBroker(
            'events/delete',
            JSON.stringify({ id: 'some-id' }),
            { retain: false }
        );

        await factory.sleep(100);

        expect(res.value).toEqual({ id: 'some-id' });
    });

    test('POSITIVE: getScenarios', async () => {
        Object.values(factory.homie.scenarios).forEach(sc => sc.validateMyStructure());
        const scenarios = factory.homie.getScenarios();

        Object.values(scenarios).forEach(sc => {
            expect(Array.isArray(sc.thresholds)).toBe(true);
            expect(sc instanceof Scenario).toBe(true);
            expect(sc._isValid).toBe(true);
        });
    });

    test('POSITIVE: getScenariosState', async () => {
        Object.values(factory.homie.scenarios).forEach(sc => sc.validateMyStructure());
        const scenariosState = factory.homie.getScenariosState();

        Object.values(scenariosState).forEach(scState => {
            expect(scState === 'false' || scState === 'true').toBe(true);
        });
    });

    test('POSITIVE: HomieServer onNewThreshold', async () => {
        let res;

        Object.keys(newScenario.threshold).forEach(topic => {
            factory.publishToBroker(topic, '');
        });
        await factory.sleep(100);

        homieServer.onNewThreshold(({ thresholdId, scenarioId }) => {
            res = homieServer.getThresholdById(scenarioId, thresholdId);
        });

        Object.keys(newScenario.scenario).forEach(topic => {
            factory.publishToBroker(topic, newScenario.scenario[topic]);
        });

        await factory.sleep(100);

        expect(res.getScenarioId()).toEqual('scenario3');
        expect(res.getId()).toEqual('setpoint');

        Object.keys(newScenario.threshold).forEach(topic => {
            factory.publishToBroker(topic, newScenario.threshold[topic]);
        });

        await factory.sleep(100);

        expect(res.getScenarioId()).toEqual('scenario3');
        expect(res.getId()).toEqual('test-1');
    });

    test('POSITIVE: HomieServer getThresholds', async () => {
        const ths = homieServer.getThresholds();

        expect(!!Object.keys(ths)).toBe(true);
        expect(!!ths.scenario3.length).toBe(true);
    });
});
