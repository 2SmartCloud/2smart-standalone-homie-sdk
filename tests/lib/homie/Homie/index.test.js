/* eslint-disable guard-for-in */
const mockedBroker = require('./../../../fixtures/__mocks__/broker/full2');
const groupsOfProperties = require('./../../../fixtures/__mocks__/broker/groups-of-properties');
const { ERROR_CODES: { NOT_SETTABLE } } = require('./../../../../lib/etc/config');

const Device = require('./../../../../lib/Device');
const Scenario = require('./../../../../lib/Scenario');
const Node = require('./../../../../lib/Node');
const Property = require('./../../../../lib/Property');
const Threshold = require('./../../../../lib/Threshold');
const Entity = require('./../../../../lib/EntitiesStore/Entity');
const Homie = require('./../../../../lib/homie/Homie');

const TestFactory = require('./../../../utils');

const factory = new TestFactory();

let testDevice;
let setRes;
let errorRes;

const publishRes = {};

function handleSet(res) {
    setRes = res;
}

function handlePublish(res) {
    publishRes[res.field] = res;
}

function handleError(res) {
    errorRes = res;
}

jest.setTimeout(15000);

describe('Homie class', () => {
    beforeAll(async () => {
        await factory.init();
        factory.publishState();

        await factory.sleep(200);
    });

    afterAll(async () => {
        await factory.end();
    });

    test('POSITIVE: get device instances from broker', async () => {
        const devices = factory.homie.getDevices();

        expect(typeof devices).toBe('object');
        expect(devices['test-device'] instanceof Device).toBe(true);
    });

    test('POSITIVE: get device by id', async () => {
        const device = factory.homie.getDeviceById('test-device');

        expect(device instanceof Device).toBe(true);
    });

    test('NEGATIVE: get device by id', async () => {
        let err;

        try {
            factory.homie.getDeviceById('fail');
        } catch (e) {
            err = e;
        }

        expect(err.fields).toEqual({ device: 'NOT_FOUND' });
    });

    test('POSITIVE: get root topic', async () => {
        expect(!!factory.homie.getRootTopic()).toBe(true);
    });

    test('POSITIVE: publish to broker', async () => {
        factory.homie.publishToBroker('some/topic', 'some value');
    });

    test('NEGATIVE: publish to broker', async () => {
        let err;

        try {
            factory.homie.publishToBroker(null, 'some value');
        } catch (e) {
            err = e;
        }

        expect(err.fields).toEqual({ topic: 'REQUIRED' });

        try {
            factory.homie.publishToBroker('some/topic');
        } catch (e) {
            err = e;
        }

        expect(err.fields).toEqual({ message: 'REQUIRED' });
    });

    test('POSITIVE: new device action', async () => {
        factory.homie.on('new_device', ({ deviceId }) => testDevice = factory.homie.getDeviceById(deviceId));

        const { device } = mockedBroker;

        for (const topic in device) {
            factory.homie.publishToBroker(topic, device[topic]);
        }

        await factory.sleep(100);

        expect(!!testDevice).toBe(true);
    });

    test('POSITIVE: subscribe device to events', async () => {
        testDevice.onAttach(factory.homie);
        testDevice.onAttributePublish(handlePublish);
        testDevice.onAttributeSet(handleSet);
        testDevice.onErrorPublish(handleError);

        expect(!!testDevice._publishEventCallback).toBe(true);
        expect(!!testDevice._setEventCallback).toBe(true);
        expect(!!testDevice._errorEventCallback).toBe(true);
        expect(testDevice._isAttached).toBe(true);
        expect(!!testDevice._homie).toBe(true);
    });

    test('POSITIVE: set/publish/error device setting', async () => {
        testDevice.setSettingAttribute('title', 'NEW TITLE');
        testDevice.publishAttribute('name', 'NEW DEVICE NAME');
        testDevice.publishSetting('title', 'NEW TITLE');
        testDevice.publishSettingError('title');

        await factory.sleep(100);

        expect(testDevice.getTitle()).toBe('NEW TITLE');
        expect(setRes).toMatchObject({
            field : 'title',
            value : 'NEW TITLE',
            type  : 'DEVICE'
        });
        expect(publishRes.name).toMatchObject({
            field : 'name',
            value : 'NEW DEVICE NAME',
            type  : 'DEVICE'
        });
        expect(publishRes.title).toMatchObject({
            field : 'title',
            value : 'NEW TITLE',
            type  : 'DEVICE'
        });
        expect(errorRes).toMatchObject({
            value : {
                code    : 'ERROR',
                message : 'Something went wrong'
            }
        });

        try {
            testDevice.setSettingAttribute('wrong');
        } catch (e) {
            expect(e.code).toBe(NOT_SETTABLE);
        }
    });

    test('POSITIVE: new device node action', async () => {
        const { node } = mockedBroker;

        for (const topic in node) {
            factory.homie.publishToBroker(topic, node[topic]);
        }

        await factory.sleep(100);

        const dNode = testDevice.getNodeById('controls');

        dNode.setSettingAttribute('title', 'NEW TITLE');
        dNode.publishAttribute('name', 'NEW NODE NAME');
        dNode.publishSetting('title', 'NEW TITLE');
        dNode.publishSettingError('title');

        await factory.sleep(100);

        expect(dNode.getName()).toBe('NEW NODE NAME');
        expect(setRes).toMatchObject({
            field : 'title',
            value : 'NEW TITLE',
            type  : 'NODE'
        });
        expect(publishRes.name).toMatchObject({
            field : 'name',
            value : 'NEW NODE NAME',
            type  : 'NODE'
        });
        expect(publishRes.title).toMatchObject({
            field : 'title',
            value : 'NEW TITLE',
            type  : 'NODE'
        });
        expect(errorRes).toMatchObject({
            value : {
                code    : 'ERROR',
                message : 'Something went wrong'
            }
        });
    });

    test('POSITIVE: new device telemetry action', async () => {
        const { deviceTelemetry } = mockedBroker;

        for (const topic in deviceTelemetry) {
            factory.homie.publishToBroker(topic, deviceTelemetry[topic]);
        }

        await factory.sleep(100);

        const dTelemetry = testDevice.getTelemetryById('signal');

        dTelemetry.setAttribute('value', '50');
        dTelemetry.publishAttribute('value', '50');
        dTelemetry.publishError();

        await factory.sleep(100);

        expect(dTelemetry.getValue()).toBe('50');
        expect(setRes).toMatchObject({
            field : 'value',
            value : '50',
            type  : 'DEVICE_TELEMETRY'
        });
        expect(publishRes.value).toMatchObject({
            field : 'value',
            value : '50',
            type  : 'DEVICE_TELEMETRY'
        });
        expect(errorRes).toMatchObject({
            value : {
                code    : 'ERROR',
                message : 'Something went wrong'
            }
        });
    });

    test('POSITIVE: new device option action', async () => {
        const { deviceOption } = mockedBroker;

        for (const topic in deviceOption) {
            factory.homie.publishToBroker(topic, deviceOption[topic]);
        }

        await factory.sleep(100);

        const dOption = testDevice.getOptionById('signal');

        dOption.setAttribute('value', '50');
        dOption.publishAttribute('value', '50');
        dOption.publishError();

        await factory.sleep(100);

        expect(dOption.getValue()).toBe('50');
        expect(setRes).toMatchObject({
            field : 'value',
            value : '50',
            type  : 'DEVICE_OPTION'
        });
        expect(publishRes.value).toMatchObject({
            field : 'value',
            value : '50',
            type  : 'DEVICE_OPTION'
        });
        expect(errorRes).toMatchObject({
            value : {
                code    : 'ERROR',
                message : 'Something went wrong'
            }
        });
    });

    test('POSITIVE: node new option action', async () => {
        const { nodeOption } = mockedBroker;

        for (const topic in nodeOption) {
            factory.homie.publishToBroker(topic, nodeOption[topic]);
        }

        await factory.sleep(100);

        const node = testDevice.getNodeById('controls');
        const nOption = node.getOptionById('signal');

        nOption.setAttribute('value', '50');
        nOption.publishAttribute('value', '50');
        nOption.publishError();

        await factory.sleep(100);

        expect(nOption.getValue()).toBe('50');
        expect(setRes).toMatchObject({
            field : 'value',
            value : '50',
            type  : 'NODE_OPTION'
        });
        expect(publishRes.value).toMatchObject({
            field : 'value',
            value : '50',
            type  : 'NODE_OPTION'
        });
        expect(errorRes).toMatchObject({
            value : {
                code    : 'ERROR',
                message : 'Something went wrong'
            }
        });
    });

    test('POSITIVE: node new telemetry action', async () => {
        const { nodeTelemetry } = mockedBroker;

        for (const topic in nodeTelemetry) {
            factory.homie.publishToBroker(topic, nodeTelemetry[topic]);
        }

        await factory.sleep(100);

        const node = testDevice.getNodeById('controls');
        const nTelemetry = node.getTelemetryById('signal');

        nTelemetry.setAttribute('value', '50');
        nTelemetry.publishAttribute('value', '50');
        nTelemetry.publishError();

        await factory.sleep(100);

        expect(nTelemetry.getValue()).toBe('50');
        expect(setRes).toMatchObject({
            field : 'value',
            value : '50',
            type  : 'NODE_TELEMETRY'
        });
        expect(publishRes.value).toMatchObject({
            field : 'value',
            value : '50',
            type  : 'NODE_TELEMETRY'
        });
        expect(errorRes).toMatchObject({
            value : {
                code    : 'ERROR',
                message : 'Something went wrong'
            }
        });
    });

    test('POSITIVE: node new sensor action', async () => {
        const { sensor } = mockedBroker;

        for (const topic in sensor) {
            factory.homie.publishToBroker(topic, sensor[topic]);
        }

        await factory.sleep(100);

        const node = testDevice.getNodeById('controls');
        const nSensor = node.getSensorById('sensor');

        nSensor.setAttribute('value', '50');
        nSensor.publishAttribute('value', '50');
        nSensor.publishError();

        await factory.sleep(100);

        expect(nSensor.getValue()).toBe('50');
        expect(setRes).toMatchObject({
            field : 'value',
            value : '50',
            type  : 'SENSOR'
        });
        expect(publishRes.value).toMatchObject({
            field : 'value',
            value : '50',
            type  : 'SENSOR'
        });
        expect(errorRes).toMatchObject({
            value : {
                code    : 'ERROR',
                message : 'Something went wrong'
            }
        });
    });

    test('POSITIVE: sensor set/pub/err setting', async () => {
        const node = testDevice.getNodeById('controls');
        const nSensor = node.getSensorById('sensor');

        nSensor.setSettingAttribute('title', 'NEW TITLE');
        nSensor.publishSetting('title', 'NEW TITLE');
        nSensor.publishSettingError('title');

        await factory.sleep(100);

        expect(setRes).toMatchObject({
            field : 'title',
            value : 'NEW TITLE',
            type  : 'SENSOR'
        });
        expect(publishRes.title).toMatchObject({
            field : 'title',
            value : 'NEW TITLE',
            type  : 'SENSOR'
        });
        expect(errorRes).toMatchObject({
            value : {
                code    : 'ERROR',
                message : 'Something went wrong'
            }
        });
    });

    test('POSITIVE: send request', async () => {
        const handler = (data) => {
            factory.homie.publishToBroker('response/type/method', JSON.stringify(data));
        };

        try {
            await new Promise((resolve, reject) => {
                factory.homie.transport.subscribe('request/type/#', (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
            await new Promise((resolve, reject) => {
                factory.homie.transport.subscribe('response/type/#', (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
            factory.homie.on('request.TYPE.method', handler);
            const res = await factory.homie.request('TYPE', 'method', { name: '123' });

            expect(res).toMatchObject({ name: '123' });
        } catch (e) {
            console.log(e);
            throw e;
        }
        factory.homie.off('request.TYPE.method', handler);
        await new Promise((resolve, reject) => {
            factory.homie.transport.unsubscribe('response/type/#', (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
        await new Promise((resolve, reject) => {
            factory.homie.transport.unsubscribe('request/type/#', (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    });

    test('POSITIVE: send response', async () => {
        const handler = (data) => {
            factory.homie.response('TYPE', 'method', data);
        };

        try {
            await new Promise((resolve, reject) => {
                factory.homie.transport.subscribe('request/type/#', (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
            await new Promise((resolve, reject) => {
                factory.homie.transport.subscribe('response/type/#', (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
            factory.homie.on('request.TYPE.method', handler);
            const res = await factory.homie.request('TYPE', 'method', { name: '123' });

            expect(res).toMatchObject({ name: '123' });
        } catch (e) {
            console.log(e);
            throw e;
        }
        factory.homie.off('request.TYPE.method', handler);
        await new Promise((resolve, reject) => {
            factory.homie.transport.unsubscribe('response/type/#', (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
        await new Promise((resolve, reject) => {
            factory.homie.transport.unsubscribe('request/type/#', (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    });

    test('POSITIVE: initializeEntityClass and destroyEntityClass', async () => {
        try {
            factory.homie.initializeEntityClass('BRIDGE_TYPES');
            expect(!!factory.homie.entitiesStore.classes.BRIDGE_TYPES).toBe(true);
            factory.homie.destroyEntityClass('BRIDGE_TYPES');
            expect(!!factory.homie.entitiesStore.classes.BRIDGE_TYPES).toBe(false);
        } catch (e) {
            console.log(e);
            throw e;
        }
    });

    test('POSITIVE: set/publish/error threshold attribute', async () => {
        let res;
        const th = factory.homie.getThresholdById('threshold', 'test-1');

        th.onAttach(factory.homie);

        const handler = data => res = data;

        th.publishError();

        th.onAttributePublish(handler);
        th.publishAttribute('value', 'true');
        await factory.sleep(100);
        expect(res).toMatchObject({
            field : 'value',
            value : 'true',
            type  : 'THRESHOLD'
        });

        factory.homie.off(th._getPublishEventName(), handler);

        res = undefined;

        factory.homie.off(th._getErrorEventName(), handler);

        th.onAttributePublish(handler);
        th.publishAttribute('value', 'true');
        await factory.sleep(100);
        expect(res).toMatchObject({
            field : 'value',
            value : 'true',
            type  : 'THRESHOLD'
        });
    });

    test('POSITIVE: getInstanceByTopic', async () => {
        const device = factory.homie.getInstanceByTopic('sweet-home/test-device/$state');
        const node = factory.homie.getInstanceByTopic('sweet-home/test-device/controls/$name');
        const sensor = factory.homie.getInstanceByTopic('sweet-home/test-device/controls/int-true');
        const deviceOption = factory.homie.getInstanceByTopic('sweet-home/test-device/$options/signal');
        const deviceTelemetry = factory.homie.getInstanceByTopic('sweet-home/test-device/$telemetry/signal');
        const nodeOption = factory.homie.getInstanceByTopic('sweet-home/test-device/controls/$options/signal');
        const nodeTelemetry = factory.homie.getInstanceByTopic('sweet-home/test-device/controls/$telemetry/signal');
        const threshold = factory.homie.getInstanceByTopic('scenarios/threshold/test-1');
        const scenario = factory.homie.getInstanceByTopic('scenarios/threshold');
        const entity = factory.homie.getInstanceByTopic('groups-of-properties/entity/$value');

        expect(device.instance instanceof Device).toEqual(true);
        expect(node.instance instanceof Node).toEqual(true);
        expect(sensor.instance instanceof Property).toEqual(true);
        expect(deviceOption.instance instanceof Property).toEqual(true);
        expect(deviceTelemetry.instance instanceof Property).toEqual(true);
        expect(nodeOption.instance instanceof Property).toEqual(true);
        expect(nodeTelemetry.instance instanceof Property).toEqual(true);
        expect(threshold.instance instanceof Threshold).toEqual(true);
        expect(scenario.instance instanceof Scenario).toEqual(true);
        expect(entity.instance instanceof Entity).toEqual(true);

        expect(device.type).toEqual('DEVICE');
        expect(node.type).toEqual('NODE');
        expect(sensor.type).toEqual('SENSOR');
        expect(deviceOption.type).toEqual('DEVICE_OPTION');
        expect(deviceTelemetry.type).toEqual('DEVICE_TELEMETRY');
        expect(nodeOption.type).toEqual('NODE_OPTION');
        expect(nodeTelemetry.type).toEqual('NODE_TELEMETRY');
        expect(threshold.type).toEqual('THRESHOLD');
        expect(entity.type).toEqual('GROUP_OF_PROPERTIES');
    });

    test('NEGATIVE: getInstanceByTopic', async () => {
        const res = factory.homie.getInstanceByTopic('invalid/topic');

        expect(res).toEqual(undefined);
    });

    test('POSITIVE: getDevicesByTypes', async () => {
        const devicesByTypes = factory.homie.getDevicesByTypes([ 'test' ]);

        expect(Object.keys(devicesByTypes).length).toEqual(1);
        expect(devicesByTypes.test.length).toEqual(1);
        expect(devicesByTypes.test[0] instanceof Device).toBe(true);
    });

    test('NEGATIVE: getDevicesByTypes', async () => {
        const devicesByTypes = factory.homie.getDevicesByTypes([ 'not-found' ]);

        expect(devicesByTypes['not-found']).toEqual([]);
    });

    test('POSITIVE: delete threshold', async () => {
        const scenarioId = 'threshold';
        const thresholdId = 'test-1';

        let thresholds = factory.homie.getAllThresholds();

        expect(Array.isArray(thresholds[scenarioId])).toBe(true);

        const threshold = thresholds[scenarioId].find(th => th.getId() === thresholdId);

        factory.homie._deleteThreshold(threshold);

        thresholds = factory.homie.getAllThresholds();

        expect(thresholds[scenarioId]).toEqual([]);
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

    test('POSITIVE: subscribe to set/pub/err of entity', async () => {
        for (const topic in groupsOfProperties) {
            factory.publishToBroker(topic, groupsOfProperties[topic]);
        }

        await factory.sleep(100);

        let res;
        const entity = factory.homie.getEntityById('GROUP_OF_PROPERTIES', 'test-1');

        entity.onAttach(factory.homie);

        const handler = data => res = data;

        entity.setAttribute('value', 'new');
        entity.onAttributeSet(handler);
        await factory.sleep(100);
        expect(res).toMatchObject({
            field : 'value',
            value : 'new',
            type  : 'GROUP_OF_PROPERTIES'
        });

        res = undefined;

        entity.onAttributePublish(handler);
        entity.publishAttribute('value', 'new');
        await factory.sleep(100);
        expect(res).toMatchObject({
            field : 'value',
            value : 'new',
            type  : 'GROUP_OF_PROPERTIES'
        });

        res = undefined;

        entity.onErrorPublish(handler);
        entity.publishError('value');
        await factory.sleep(100);
        expect(res).toMatchObject({
            type  : 'GROUP_OF_PROPERTIES',
            field : 'value',
            value : {
                code    : 'ERROR',
                message : 'Something went wrong'
            }
        });

        // delete artifact after test
        entity.publishAttribute('value', '');
    });

    test('POSITIVE: emit discovery.new event', done => {
        const discoveryDevice = {
            id   : 'device-id',
            name : 'discovery-device-name'
        };
        const discoveryNewTopic = `discovery/new/${discoveryDevice.id}`;

        factory.homie.on('discovery.new', payload => {
            expect(payload).toMatchObject(discoveryDevice);
            done();
        });

        factory.homie.publishToBroker(discoveryNewTopic, discoveryDevice.name);
    });

    test('POSITIVE: create Homie instance with default options', () => {
        const homie = new Homie({ transport: factory.transport });

        expect(homie.syncMaxDelay).toEqual(10000);
        expect(homie.syncResetTimeout).toEqual(1000);
        expect(homie.debugMode).toEqual(false);
        expect(homie.rootTopic).toEqual('');
    });

    test('POSITIVE: create Homie instance with custom options', () => {
        const homie = new Homie({
            transport        : factory.transport,
            syncMaxDelay     : 5000,
            syncResetTimeout : 100,
            rootTopic        : 'abc',
            debug            : true
        });

        expect(homie.syncMaxDelay).toEqual(5000);
        expect(homie.syncResetTimeout).toEqual(100);
        expect(homie.debugMode).toEqual(true);
        expect(homie.rootTopic).toEqual('abc');
    });
});
