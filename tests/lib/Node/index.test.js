const mockedDevice = require('./../../fixtures/__mocks__/objects/device');
const mockedNode = require('./../../fixtures/__mocks__/objects/node');
const mockedProperty = require('./../../fixtures/__mocks__/objects/property');

const TestFactory = require('./../../utils');
const Device = require('./../../../lib/Device');
const Node = require('./../../../lib/Node');
const Property = require('./../../../lib/Property');
const Sensor = require('./../../../lib/Sensor');
const Homie = require('./../../../lib/homie/Homie');

const factory = new TestFactory();

jest.setTimeout(15000);

describe('Node class', () => {
    test('POSITIVE: create node instance', async () => {
        const node = new Node(mockedNode);
        const isNodeInstance = node instanceof Node;

        expect(isNodeInstance).toBe(true);
    });

    test('NEGATIVE: invalid options: id, name, state', async () => {
        const invalidNode = {
            ...mockedNode,
            id : '-invalid-id-'
        };
        let err;

        try {
            new Node(invalidNode);
        } catch (e) {
            err = e;
        }
        expect(err.fields).toEqual({
            id : 'WRONG_FORMAT'
        });
    });

    test('POSITIVE: check serialize method', async () => {
        const node = new Node({ id: mockedNode.id });

        node.updateAttribute({
            name  : mockedNode.name,
            state : mockedNode.state,
            type  : mockedNode.type
        });

        const serialized = node.serialize();

        expect(Array.isArray(serialized.sensors)).toBe(true);
        expect(Array.isArray(serialized.telemetry)).toBe(true);
        expect(Array.isArray(serialized.options)).toBe(true);

        delete serialized.sensors;
        delete serialized.telemetry;
        delete serialized.options;

        expect(serialized).toMatchObject({
            id    : mockedNode.id,
            name  : mockedNode.name,
            state : mockedNode.state,
            type  : mockedNode.type
        });
    });

    test('POSITIVE: check node getters', async () => {
        const node = new Node(mockedNode);

        node.updateAttribute({
            name  : mockedNode.name,
            state : mockedNode.state,
            type  : mockedNode.type,
            range : mockedNode.range
        });

        const id = node.getId();
        const name = node.getName();
        const sensors = node.getSensors();
        const options = node.getOptions();
        const telemetries = node.getTelemetry();
        const state = node.getState();
        const type = node.getType();

        expect(id).toEqual(mockedNode.id);
        expect(name).toEqual(mockedNode.name);
        expect(state).toEqual(mockedNode.state);
        expect(type).toEqual(mockedNode.type);

        expect(Array.isArray(sensors)).toBe(true);
        expect(Array.isArray(options)).toBe(true);
        expect(Array.isArray(telemetries)).toBe(true);
    });

    test('NEGATIVE: invalid id for getById methods', async () => {
        const node = new Node(mockedNode);
        let err;

        try {
            node.getSensorById('wrong-id');
        } catch (e) {
            err = e;
        }
        expect(err.fields).toEqual({ sensor: 'NOT_FOUND' });

        try {
            node.getOptionById('wrong-id');
        } catch (e) {
            err = e;
        }
        expect(err.fields).toEqual({ option: 'NOT_FOUND' });

        try {
            node.getTelemetryById('wrong-id');
        } catch (e) {
            err = e;
        }
        expect(err.fields).toEqual({ telemetry: 'NOT_FOUND' });
    });

    test('POSITIVE: onAttach method', async () => {
        const node = new Node(mockedNode);

        node.onAttach(factory.homie);

        expect(node._homie instanceof Homie).toBe(true);
        expect(node._isAttached).toBe(true);
    });

    test('POSITIVE: get parent instances', async () => {
        const device = new Device({ id: mockedDevice.id });
        const node = new Node({ id: mockedNode.id });

        device.addNode(node);

        expect(node.getDevice()).toEqual(device);
        expect(node.getDeviceId()).toBe(mockedDevice.id);
    });

    test('NEGATIVE: get parent device id', async () => {
        const node = new Node(mockedNode);
        let err;

        try {
            node.getDeviceId();
        } catch (e) {
            err = e;
        }

        expect(err.fields).toEqual({ device: 'NOT_FOUND' });
    });

    test('POSITIVE: add sensor/telemetry/option', async () => {
        const node = new Node({ id: mockedNode.id });
        const prop = new Property({ id: mockedProperty.id });
        const sensor = new Sensor({ id: mockedProperty.id });

        node.addTelemetry(prop);
        node.addSensor(sensor);
        node.addOption(prop);

        const s = node.getSensorById(mockedProperty.id);
        const t = node.getTelemetryById(mockedProperty.id);
        const o = node.getOptionById(mockedProperty.id);

        expect(Boolean(s)).toBe(true);
        expect(Boolean(t)).toBe(true);
        expect(Boolean(o)).toBe(true);
    });

    test('NEGATIVE: add sensor/telemetry/option that already exists', async () => {
        const node = new Node({ id: mockedNode.id });
        const prop = new Property({ id: mockedProperty.id });
        const sensor = new Sensor({ id: mockedProperty.id });

        node.addTelemetry(prop);
        node.addSensor(sensor);
        node.addOption(prop);

        let err;

        try {
            node.addTelemetry(prop);
        } catch (e) {
            err = e;
        }

        expect(err.fields).toEqual({ telemetry: 'EXISTS' });

        try {
            node.addSensor(sensor);
        } catch (e) {
            err = e;
        }

        expect(err.fields).toEqual({ sensor: 'EXISTS' });

        try {
            node.addOption(prop);
        } catch (e) {
            err = e;
        }

        expect(err.fields).toEqual({ option: 'EXISTS' });
    });

    test('NEGATIVE: add sensor/telemetry/option', async () => {
        const node = new Node({ id: mockedNode.id });
        let err;

        try {
            node.addTelemetry(mockedProperty);
        } catch (e) {
            err = e;
        }

        expect(err.fields).toEqual({ telemetry: 'WRONG_FORMAT' });

        try {
            node.addSensor(mockedProperty);
        } catch (e) {
            err = e;
        }

        expect(err.fields).toEqual({ sensor: 'WRONG_FORMAT' });

        try {
            node.addOption(mockedProperty);
        } catch (e) {
            err = e;
        }

        expect(err.fields).toEqual({ option: 'WRONG_FORMAT' });
    });

    test('POSITIVE: delete node', () => {
        const node = new Node({ id: mockedNode.id });

        node.updateAttribute({
            name  : mockedNode.name,
            type  : mockedNode.type,
            state : mockedNode.state,
            title : mockedNode.title
        });
        node.delete();

        expect(node.name).toBe('');
        expect(node.type).toBe('');
        expect(node.state).toBe('');
        expect(node.title).toBe('');

        expect(node._isValid).toBe(false);
        expect(node._isAttached).toBe(false);

        expect(node._publishEventCallback).toBe(null);
        expect(node._setEventCallback).toBe(null);
        expect(node._errorEventCallback).toBe(null);
    });

    test('NEGATIVE: subscribe instance to events', async () => {
        const node = new Node({ id: mockedNode.id });

        node._subscribeInstanceToEvents();

        expect(!!node._publishEventCallback).toBe(false);
        expect(!!node._setEventCallback).toBe(false);
        expect(!!node._errorEventCallback).toBe(false);
    });

    test('NEGATIVE: subscribe to events', async () => {
        const node = new Node({ id: mockedNode.id });

        node._subscribeToPublish();
        node._subscribeToSet();
        node._subscribeToError();

        expect(!!node._publishEventCallback).toBe(false);
        expect(!!node._setEventCallback).toBe(false);
        expect(!!node._errorEventCallback).toBe(false);
    });

    test('POSITIVE: getTopics with settings', async () => {
        const device = new Device({ id: mockedDevice.id });
        const node = new Node({ id: mockedNode.id });

        device.addNode(node);
        node.onAttach(factory.homie);

        expect(node.getTopics(true)).toEqual({
            'sweet-home/device-id/thermometer/$name'                          : '',
            'sweet-home/device-id/thermometer/$type'                          : '',
            'sweet-home/device-id/thermometer/$state'                         : '',
            'sweet-home/device-id/thermometer/$telemetry'                     : '',
            'sweet-home/device-id/thermometer/$options'                       : '',
            'sweet-home/device-id/thermometer/$properties'                    : '',
            'device-settings/sweet-home/device-id/thermometer/$title'         : '',
            'device-settings/sweet-home/device-id/thermometer/$hidden'        : 'false',
            'device-settings/sweet-home/device-id/thermometer/$last-activity' : ''
        });
    });
});
