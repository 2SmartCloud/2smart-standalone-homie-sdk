/* eslint-disable more/no-then */
/* eslint-disable guard-for-in */
const HomieClient = require('./../../../../lib/homie/HomieClient');
const Scenario = require('./../../../../lib/Scenario');
const Device = require('./../../../../lib/Device');
const Node = require('./../../../../lib/Node');
const Property = require('./../../../../lib/Property');
const Sensor = require('./../../../../lib/Sensor');

const { ERROR_CODES: { NOT_FOUND, EXISTS } } = require('./../../../../lib/etc/config');

const TestFactory = require('./../../../utils');
const brokerDevice = require('./../../../fixtures/__mocks__/broker/device');
const brokerNode = require('./../../../fixtures/__mocks__/broker/node');
const brokerDeviceTelemetry = require('./../../../fixtures/__mocks__/broker/device-telemetry');
const brokerDeviceOption = require('./../../../fixtures/__mocks__/broker/device-option');
const brokerNodeTelemetry = require('./../../../fixtures/__mocks__/broker/node-telemetry');
const brokerNodeOption = require('./../../../fixtures/__mocks__/broker/node-option');
const brokerSensor = require('./../../../fixtures/__mocks__/broker/sensor');
const newScenario = require('./../../../fixtures/__mocks__/broker/new_scenario');
const groupsOfProperties = require('./../../../fixtures/__mocks__/broker/groups-of-properties');

const factory = new TestFactory();
let homieClient;

jest.setTimeout(15000);

describe('HomieClient class', () => {
    afterAll(async () => {
        await factory.end();
    });

    test('POSITIVE: Create HomieClient instance', async () => {
        homieClient = new HomieClient({ homie: factory.homie });

        expect(!!homieClient).toBe(true);
    });

    test('NEGATIVE: Create HomieClient instance', async () => {
        let err;

        try {
            homieClient = new HomieClient();
        } catch (e) {
            err = e;
        }

        expect(!!err).toBe(true);

        try {
            homieClient = new HomieClient({ homie: null });
        } catch (e) {
            err = e;
        }

        expect(!!err).toBe(true);
    });

    test('POSITIVE: HomieClient initWorld', async () => {
        await homieClient.initWorld();

        factory.publishState();

        await factory.sleep(2000);

        expect(!!Object.keys(homieClient.getDevices())).toBe(true);
    });

    test('POSITIVE: HomieClient onNewDeviceAdded', async () => {
        let res;

        homieClient.onNewDeviceAdded(data => res = data);

        for (const topic in brokerDevice) {
            factory.publishToBroker(topic, brokerDevice[topic]);
        }

        await factory.sleep(100);

        expect(res).toEqual({ deviceId: 'test-device-2' });

        const device = homieClient.getDeviceById('test-device-2');

        expect(device instanceof Device).toBe(true);
    });

    test('POSITIVE: HomieClient onNewNodeAdded', async () => {
        let res;

        homieClient.onNewNodeAdded(data => res = data);

        for (const topic in brokerNode) {
            factory.publishToBroker(topic, brokerNode[topic]);
        }

        await factory.sleep(100);

        expect(res).toEqual({ deviceId: 'test-device-2', nodeId: 'controls' });

        const device = homieClient.getDeviceById('test-device-2');
        const node = device.getNodeById('controls');

        expect(node instanceof Node).toBe(true);
    });

    test('POSITIVE: HomieClient onNewDeviceTelemetryAdded', async () => {
        let res;

        homieClient.onNewDeviceTelemetryAdded(data => res = data);

        for (const topic in brokerDeviceTelemetry) {
            factory.publishToBroker(topic, brokerDeviceTelemetry[topic]);
        }

        await factory.sleep(100);

        expect(res).toEqual({ deviceId: 'test-device-2', nodeId: null, telemetryId: 'signal' });

        const device = homieClient.getDeviceById('test-device-2');
        const telemetry = device.getTelemetryById('signal');

        expect(telemetry instanceof Property).toBe(true);
    });

    test('POSITIVE: HomieClient onNewSensorAdded', async () => {
        let res;

        homieClient.onNewSensorAdded(data => res = data);

        for (const topic in brokerSensor) {
            factory.publishToBroker(topic, brokerSensor[topic], { retain: false });
        }

        await factory.sleep(100);

        expect(res).toEqual({ deviceId: 'test-device-2', nodeId: 'controls', sensorId: 'int-false' });

        const device = homieClient.getDeviceById('test-device-2');
        const node = device.getNodeById('controls');
        const sensor = node.getSensorById('int-false');

        expect(sensor instanceof Sensor).toBe(true);
    });

    test('POSITIVE: HomieClient onNewDeviceOptionAdded', async () => {
        let res;

        homieClient.onNewDeviceOptionAdded(data => res = data);

        for (const topic in brokerDeviceOption) {
            factory.publishToBroker(topic, brokerDeviceOption[topic], { retain: false });
        }

        await factory.sleep(100);

        expect(res).toEqual({ deviceId: 'test-device-2', nodeId: null, optionId: 'signal' });

        const device = homieClient.getDeviceById('test-device-2');
        const option = device.getOptionById('signal');

        expect(option instanceof Property).toBe(true);
    });

    test('POSITIVE: HomieClient onNewNodeTelemetryAdded', async () => {
        let res;

        homieClient.onNewNodeTelemetryAdded(data => res = data);

        for (const topic in brokerNodeTelemetry) {
            factory.publishToBroker(topic, brokerNodeTelemetry[topic], { retain: false });
        }

        await factory.sleep(100);

        expect(res).toEqual({ deviceId: 'test-device-2', nodeId: 'controls', telemetryId: 'signal' });

        const device = homieClient.getDeviceById('test-device-2');
        const node = device.getNodeById('controls');
        const telemetry = node.getTelemetryById('signal');

        expect(telemetry instanceof Property).toBe(true);
    });

    test('POSITIVE: HomieClient onNewNodeOptionAdded', async () => {
        let res;

        homieClient.onNewNodeOptionAdded(data => res = data);

        for (const topic in brokerNodeOption) {
            factory.publishToBroker(topic, brokerNodeOption[topic], { retain: false });
        }

        await factory.sleep(100);

        expect(res).toEqual({ deviceId: 'test-device-2', nodeId: 'controls', optionId: 'signal' });

        const device = homieClient.getDeviceById('test-device-2');
        const node = device.getNodeById('controls');
        const option = node.getOptionById('signal');

        expect(option instanceof Property).toBe(true);
    });


    test('POSITIVE: HomieClient onNewScenario', async () => {
        let scenario;

        homieClient.onNewScenario(({ scenarioId }) => {
            scenario = factory.homie.scenarios[scenarioId];
        });

        Object.keys(newScenario.scenario).forEach(topic => {
            factory.publishToBroker(topic, newScenario.scenario[topic]);
        });

        await factory.sleep(300);

        expect(scenario.getId()).toEqual('scenario3');
    });

    test('POSITIVE: HomieClient onNewThreshold', async () => {
        let threshold;

        homieClient.onNewThreshold(({ thresholdId, scenarioId }) => {
            threshold = homieClient.getThresholdById(scenarioId, thresholdId);
        });

        Object.keys(newScenario.threshold).forEach(topic => {
            factory.publishToBroker(topic, newScenario.threshold[topic]);
        });

        await factory.sleep(300);

        expect(threshold.getId()).toEqual('test-1');
    });

    test('POSITIVE: HomieClient onNewEntityAdded', async () => {
        let res;

        homieClient.onNewEntityAdded(data => res = data);

        for (const topic in groupsOfProperties) {
            factory.publishToBroker(topic, groupsOfProperties[topic]);
        }

        await factory.sleep(100);

        expect(res).toMatchObject({ entityId: 'test-1', type: 'GROUP_OF_PROPERTIES' });
    });

    test('POSITIVE: get list of Devices from broker', async () => {
        const devices = homieClient.getDevices();

        expect(typeof devices).toBe('object');
        expect(devices['test-device'] instanceof Device).toBe(true);
    });

    test('POSITIVE: get device by id', async () => {
        const device = homieClient.getDeviceById('test-device');

        expect(device instanceof Device).toBe(true);
    });

    test('NEGATIVE: get device by id', async () => {
        let err;

        try {
            homieClient.getDeviceById('fail');
        } catch (e) {
            err = e;
        }

        expect(err.fields).toEqual({ device: NOT_FOUND });
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

    test('POSITIVE: getScenarioById', async () => {
        Object.values(factory.homie.scenarios).forEach(sc => sc.validateMyStructure());
        const scenario = factory.homie.getScenarioById('scenario3');

        expect(Array.isArray(scenario.thresholds)).toBe(true);
        expect(scenario instanceof Scenario).toBe(true);
        expect(scenario._isValid).toBe(true);
    });

    test('POSITIVE: HomieClient getThresholds', async () => {
        const ths = homieClient.getThresholds();

        expect(!!Object.keys(ths)).toBe(true);
        expect(!!ths.scenario3.length).toBe(true);
    });

    test('POSITIVE: HomieClient getEntities', async () => {
        let list = homieClient.getEntities();

        expect(list).toEqual({});

        list = homieClient.getEntities('GROUP_OF_PROPERTIES');

        expect(!!Object.keys(list)).toBe(true);
    });

    test('POSITIVE: HomieClient getEntityById', async () => {
        const res = homieClient.getEntityById('GROUP_OF_PROPERTIES', 'test-1');

        expect(!!res).toBe(true);
        expect(res._isAttached).toBe(true);
    });

    test('NEGATIVE: get non-existing entity by id', async () => {
        try {
            homieClient.getEntityById('GROUP_OF_PROPERTIES', '123123-qqq');
        } catch (e) {
            expect(e.code).toBe(NOT_FOUND);
            expect(e.fields.id).toBe('NOT_FOUND');
        }
    });

    test('NEGATIVE: get non-existing entity by type', async () => {
        try {
            homieClient.getEntityById('WRONG_TYPE', '123123-qqq');
        } catch (e) {
            expect(e.code).toBe(NOT_FOUND);
        }
    });

    test('NEGATIVE: get wrong entity type', async () => {
        const groups = homieClient.getEntities('WRONG_TYPE');

        expect(Object.keys(groups).length).toEqual(0);
    });

    test('POSITIVE: initializeEntityClass and destroyEntityClass', async () => {
        const homie = homieClient.homie;
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
            homieClient.initializeEntityClass('BRIDGE_TYPES');
            homieClient.destroyEntityClass('BRIDGE_TYPES');

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

    test('POSITIVE: HomieClient createEntityRequest success', async () => {
        const handler = data => {
            const { entityId, translated: { value: { name } } } = data;

            factory.publishToBroker(`groups-of-properties/${entityId}/$name`, name);
        };

        homieClient.homie.on('homie.entity.GROUP_OF_PROPERTIES.create', handler);

        try {
            const res = await homieClient.createEntityRequest('GROUP_OF_PROPERTIES', { name: 'Group name 1111111' });

            homieClient.homie.off('homie.entity.GROUP_OF_PROPERTIES.create', handler);

            expect(res.type).toBe('GROUP_OF_PROPERTIES');
        } catch (e) {
            console.log(e);
            throw e;
        }
    });

    test('NEGATIVE: HomieClient createEntityRequest error', async () => {
        const handler = data => {
            const { entityId, translated: { value: { name } } } = data;

            factory.publishToBroker(`errors/groups-of-properties/${entityId}/create`, JSON.stringify({
                code    : EXISTS,
                message : `Group with name - ${name} already exists!`
            }));
        };

        homieClient.homie.on('homie.entity.GROUP_OF_PROPERTIES.create', handler);

        try {
            await homieClient.createEntityRequest('GROUP_OF_PROPERTIES', { name: 'Group name 1111111' });

            homieClient.homie.off('homie.entity.GROUP_OF_PROPERTIES.create', handler);
        } catch (e) {
            expect(e.code).toBe(EXISTS);
        }
    });

    test('NEGATIVE: HomieClient createEntityRequest wrong entity type', async () => {
        try {
            await homieClient.createEntityRequest('WRONG', {});
        } catch (e) {
            expect(e.code).toBe(NOT_FOUND);
        }
    });

    test('POSITIVE: subscribe to device events', async () => {
        const device = homieClient.getDeviceById('test-device-2');

        device.onAttributePublish(() => {});
        device.onAttributeSet(() => {});
        device.onErrorPublish(() => {});

        expect(!!device._publishEventCallback).toBe(true);
        expect(!!device._setEventCallback).toBe(true);
        expect(!!device._errorEventCallback).toBe(true);
    });

    test('POSITIVE: Property.addGroupRequest', async () => {
        const device = homieClient.getDeviceById('test-device-2');
        const node = device.getNodeById('controls');
        const telemetry = node.getTelemetryById('signal');

        // emulate add group event
        setTimeout(() => {
            factory.homie.publishToBroker(`${telemetry.getRootSettingTopic()}/$groups`, 'group-1');
        }, 0);

        const res = await telemetry.addGroupRequest('group-1');

        expect(res.groups.includes('group-1')).toBe(true);
    });

    test('POSITIVE: Property.deleteGroupRequest', async () => {
        const device = homieClient.getDeviceById('test-device-2');
        const node = device.getNodeById('controls');
        const telemetry = node.getTelemetryById('signal');

        // emulate delete group event
        setTimeout(() => {
            factory.homie.publishToBroker(`${telemetry.getRootSettingTopic()}/$groups`, '');
        }, 0);

        const res = await telemetry.deleteGroupRequest('group-1');

        expect(res.groups.includes('group-1')).toBe(false);
    });

    test('NEGATIVE: Property.addGroupRequest', async () => {
        const device = homieClient.getDeviceById('test-device-2');
        const node = device.getNodeById('controls');
        const telemetry = node.getTelemetryById('signal');

        // emulate add group error event
        setTimeout(() => {
            factory.homie.publishToBroker(`${factory.homie.errorTopic}/${telemetry.getRootSettingTopic()}/$groups`, '{"code":"ERROR","message":"Error message"}');
        }, 0);

        try {
            await telemetry.addGroupRequest('group-1');
        } catch (e) {
            expect(e.code).toBe('ERROR');
        }
    });

    test('NEGATIVE: Property.deleteGroupRequest', async () => {
        const device = homieClient.getDeviceById('test-device-2');
        const node = device.getNodeById('controls');
        const telemetry = node.getTelemetryById('signal');

        // emulate add group error event
        setTimeout(() => {
            factory.homie.publishToBroker(`${factory.homie.errorTopic}/${telemetry.getRootSettingTopic()}/$groups`, '{"code":"ERROR","message":"Error message"}');
        }, 0);

        try {
            await telemetry.deleteGroupRequest('group-1');
        } catch (e) {
            expect(e.code).toBe('ERROR');
        }
    });

    test('POSITIVE: HomieClient onDelete node', async () => {
        let res;

        const device = homieClient.getDeviceById('test-device-2');
        const handler = () => {
            Object.keys(brokerNode).forEach(topic => {
                factory.publishToBroker(topic, '');
            });
        };

        device.deleteRequest();

        factory.homie.on('events.delete', handler);
        homieClient.onDelete(data => {
            if (data.type === 'NODE') res = data;
        });

        await factory.sleep(100);
        factory.homie.off('events.delete', handler);

        expect(res).toMatchObject({
            type     : 'NODE',
            deviceId : 'test-device-2',
            nodeId   : 'controls'
        });
    });

    test('POSITIVE: HomieClient onDelete device', async () => {
        let res;

        homieClient.onDelete(data => res = data);

        Object.keys(brokerDevice).forEach(topic => {
            factory.publishToBroker(topic, '');
        });

        await factory.sleep(100);

        expect(res).toMatchObject({
            type     : 'DEVICE',
            deviceId : 'test-device-2'
        });
    });

    test('POSITIVE: Entity deleteRequest', async () => {
        const group = factory.homie.getEntityById('GROUP_OF_PROPERTIES', 'test-1');

        try {
            setTimeout(() => factory.homie.publishToBroker('errors/groups-of-properties/test-1/delete', '{"code":"ERROR"}'), 0);
            await group.deleteRequest();
        } catch (e) {
            expect(e.code).toBe('ERROR');
        }

        setTimeout(() => {
            factory.homie.publishToBroker('groups-of-properties/test-1/$value', '');
            factory.homie.publishToBroker('groups-of-properties/test-1/$name', '');
        }, 0);
        await group.deleteRequest();
        expect(group._isValid).toBe(false);
    });
});
