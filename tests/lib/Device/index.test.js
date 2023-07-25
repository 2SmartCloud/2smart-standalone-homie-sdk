const mockedDevice = require('./../../fixtures/__mocks__/objects/device');
const mockedNode = require('./../../fixtures/__mocks__/objects/node');
const mockedProperty = require('./../../fixtures/__mocks__/objects/property');

const { ERROR_CODES: { WRONG_FORMAT, EXISTS, NOT_FOUND } } = require('./../../../lib/etc/config');

const TestFactory = require('./../../utils');
const Device = require('./../../../lib/Device');
const Node = require('./../../../lib/Node');
const Property = require('./../../../lib/Property');
const Homie = require('./../../../lib/homie/Homie');

const factory = new TestFactory();

jest.setTimeout(15000);

describe('Device class', () => {
    test('POSITIVE: create device instance', async () => {
        const device = new Device({ id: mockedDevice.id });
        const isDeviceInstance = device instanceof Device;

        expect(isDeviceInstance).toBe(true);

        device.updateAttribute({
            name            : mockedDevice.name,
            firmwareName    : mockedDevice.firmwareName,
            firmwareVersion : mockedDevice.firmwareVersion,
            localIp         : mockedDevice.localIp,
            mac             : mockedDevice.mac,
            implementation  : mockedDevice.implementation,
            state           : mockedDevice.state
        });

        device.validateMyStructure();

        expect(device._isValid).toBe(true);
    });

    test('NEGATIVE: invalid options: id, name, state, firmware', async () => {
        const invalidDevice = {
            ...mockedDevice,
            id : '-invalid-id-'
        };
        let err;

        try {
            new Device(invalidDevice);
        } catch (e) {
            err = e;
        }

        expect(err.fields).toEqual({
            id : WRONG_FORMAT
        });
    });

    test('POSITIVE: check serialize method', async () => {
        const device = new Device({ id: mockedDevice.id });
        const node = new Node({ id: mockedNode.id });
        const property = new Property({ id: mockedProperty.id });

        device.updateAttribute({
            name            : mockedDevice.name,
            firmwareName    : mockedDevice.firmwareName,
            firmwareVersion : mockedDevice.firmwareVersion,
            localIp         : mockedDevice.localIp,
            mac             : mockedDevice.mac,
            implementation  : mockedDevice.implementation,
            state           : mockedDevice.state
        });

        node.updateAttribute({
            name  : mockedNode.name,
            state : mockedNode.state,
            type  : mockedNode.type
        });

        property.updateAttribute(mockedProperty);

        node.validateMyStructure();
        property.validateMyStructure();

        device.addNode(node);
        device.addOption(property);
        device.addTelemetry(property);

        const serialized = device.serialize();

        expect(Array.isArray(serialized.nodes)).toBe(true);
        expect(Array.isArray(serialized.telemetry)).toBe(true);
        expect(Array.isArray(serialized.options)).toBe(true);

        expect(serialized.nodes.length).toBe(1);
        expect(serialized.telemetry.length).toBe(1);
        expect(serialized.options.length).toBe(1);

        delete serialized.nodes;
        delete serialized.telemetry;
        delete serialized.options;

        expect(serialized).toMatchObject({
            id              : mockedDevice.id,
            mac             : mockedDevice.mac,
            name            : mockedDevice.name,
            state           : mockedDevice.state,
            localIp         : mockedDevice.localIp,
            firmwareName    : mockedDevice.firmwareName,
            firmwareVersion : mockedDevice.firmwareVersion,
            implementation  : mockedDevice.implementation
        });
    });

    test('POSITIVE: check device getters', async () => {
        const device = new Device({ id: mockedDevice.id });

        device.updateAttribute({
            name            : mockedDevice.name,
            firmwareName    : mockedDevice.firmwareName,
            firmwareVersion : mockedDevice.firmwareVersion,
            localIp         : mockedDevice.localIp,
            mac             : mockedDevice.mac,
            implementation  : mockedDevice.implementation,
            state           : mockedDevice.state
        });

        const id = device.getId();
        const name = device.getName();
        const nodes = device.getNodes();
        const options = device.getOptions();
        const telemetries = device.getTelemetry();
        const firmwareName = device.getFirmwareName();
        const firmwareVersion = device.getFirmwareVersion();
        const localIp = device.getLocalIp();
        const mac = device.getMac();
        const implementation = device.getImplementation();
        const state = device.getState();
        const title = device.getTitle();

        expect(id).toEqual(mockedDevice.id);
        expect(mac).toEqual(mockedDevice.mac);
        expect(name).toEqual(mockedDevice.name);
        expect(state).toEqual(mockedDevice.state);
        expect(localIp).toEqual(mockedDevice.localIp);
        expect(firmwareName).toEqual(mockedDevice.firmwareName);
        expect(firmwareVersion).toEqual(mockedDevice.firmwareVersion);
        expect(implementation).toEqual(mockedDevice.implementation);
        expect(title).toEqual('');

        expect(Array.isArray(nodes)).toBe(true);
        expect(Array.isArray(options)).toBe(true);
        expect(Array.isArray(telemetries)).toBe(true);
    });

    test('NEGATIVE: invalid id for getById methods', async () => {
        const device = new Device(mockedDevice);
        let err;

        try {
            device.getNodeById('wrong-id');
        } catch (e) {
            err = e;
        }

        expect(err.fields).toEqual({ node: 'NOT_FOUND' });

        try {
            device.getOptionById('wrong-id');
        } catch (e) {
            err = e;
        }

        expect(err.fields).toEqual({ option: 'NOT_FOUND' });

        try {
            device.getTelemetryById('wrong-id');
        } catch (e) {
            err = e;
        }

        expect(err.fields).toEqual({ telemetry: 'NOT_FOUND' });
    });

    test('POSITIVE: onAttach method', async () => {
        const device = new Device(mockedDevice);

        device.onAttach(factory.homie);

        expect(device._homie instanceof Homie).toBe(true);
        expect(device._isAttached).toBe(true);
    });

    test('POSITIVE: add node/telemetry/option', async () => {
        const device = new Device({ id: mockedDevice.id });
        const node = new Node({ id: mockedNode.id });
        const prop = new Property({ id: mockedProperty.id });

        device.addTelemetry(prop);
        device.addNode(node);
        device.addOption(prop);

        const n = device.getNodeById(mockedNode.id);
        const t = device.getTelemetryById(mockedProperty.id);
        const o = device.getOptionById(mockedProperty.id);

        expect(Boolean(n)).toBe(true);
        expect(Boolean(t)).toBe(true);
        expect(Boolean(o)).toBe(true);
    });

    test('NEGATIVE: add node/telemetry/option that already exists', async () => {
        const device = new Device({ id: mockedDevice.id });
        const node = new Node({ id: mockedNode.id });
        const prop = new Property({ id: mockedProperty.id });

        device.addTelemetry(prop);
        device.addNode(node);
        device.addOption(prop);

        let err;

        try {
            device.addTelemetry(prop);
        } catch (e) {
            err = e;
        }

        expect(err.fields).toEqual({ telemetry: EXISTS });

        try {
            device.addNode(node);
        } catch (e) {
            err = e;
        }

        expect(err.fields).toEqual({ node: EXISTS });

        try {
            device.addOption(prop);
        } catch (e) {
            err = e;
        }

        expect(err.fields).toEqual({ option: EXISTS });
    });

    test('NEGATIVE: add node/telemetry/option', async () => {
        const device = new Device({ id: mockedDevice.id });
        let err;

        try {
            device.addTelemetry(mockedProperty);
        } catch (e) {
            err = e;
        }

        expect(err.fields).toEqual({ telemetry: WRONG_FORMAT });

        try {
            device.addNode(mockedNode);
        } catch (e) {
            err = e;
        }

        expect(err.fields).toEqual({ node: WRONG_FORMAT });

        try {
            device.addOption(mockedProperty);
        } catch (e) {
            err = e;
        }

        expect(err.fields).toEqual({ option: WRONG_FORMAT });
    });

    test('POSITIVE: delete device', () => {
        const device = new Device({ id: mockedDevice.id });

        device.updateAttribute({
            name            : mockedDevice.name,
            firmwareName    : mockedDevice.firmwareName,
            firmwareVersion : mockedDevice.firmwareVersion,
            localIp         : mockedDevice.localIp,
            mac             : mockedDevice.mac,
            implementation  : mockedDevice.implementation,
            state           : mockedDevice.state
        });

        device.delete();

        expect(device.name).toBe('');
        expect(device.firmwareName).toBe('');
        expect(device.firmwareVersion).toBe('');
        expect(device.localIp).toBe('');
        expect(device.mac).toBe('');
        expect(device.implementation).toBe('');
        expect(device.state).toBe('');
        expect(device.title).toBe('');

        expect(device._isValid).toBe(false);
        expect(device._isAttached).toBe(false);
        expect(Object.keys(device._groupsMap).length).toBe(0);

        expect(device._publishEventCallback).toBe(null);
        expect(device._setEventCallback).toBe(null);
        expect(device._errorEventCallback).toBe(null);
    });

    test('POSITIVE: getMapByGroupId', async () => {
        const device = new Device({ id: mockedDevice.id });

        device._updateGroupMap({ type: 'SENSOR', groupId: 'test', nodeId: 'node-1', propertyId: 's-1' });
        expect(!!device.getMapByGroupId('test')).toBe(true);
    });

    test('POSITIVE: deleteMapByGroupId', async () => {
        const device = new Device({ id: mockedDevice.id });

        device._updateGroupMap({ type: 'SENSOR', groupId: 'test', nodeId: 'node-1', propertyId: 's-1' });
        device.deleteMapByGroupId('test');
        expect(!!device.getMapByGroupId('test')).toBe(false);
    });

    test('POSITIVE: _errorHandler', async () => {
        let res;
        const device = new Device({ id: mockedDevice.id });

        device._errorEventCallback = data => res = data;
        device._errorHandler({ name: 'ERROR' });

        expect(res).toMatchObject({ type: 'DEVICE', field: 'name' });
    });

    test('POSITIVE: _setHandler', async () => {
        let res;
        const device = new Device({ id: mockedDevice.id });

        device._setEventCallback = data => res = data;
        device._setHandler({ name: 'set-name' });

        expect(res).toMatchObject({ type: 'DEVICE', field: 'name' });
    });

    test('NEGATIVE: subscribe to events', async () => {
        const device = new Device({ id: mockedDevice.id });

        device.onAttributePublish(() => {});
        device.onAttributeSet(() => {});
        device.onErrorPublish(() => {});

        expect(!!device._publishEventCallback).toBe(false);
        expect(!!device._setEventCallback).toBe(false);
        expect(!!device._errorEventCallback).toBe(false);
    });

    test('POSITIVE: delete node', async () => {
        const device = new Device({ id: mockedDevice.id });
        const node = new Node({ id: mockedNode.id });

        device.addNode(node);

        device.removeNodeById(mockedNode.id);
        expect(!!device.nodes.find(n => n.id === mockedNode.id)).toBe(false);
    });

    test('NEGATIVE: delete node', async () => {
        const device = new Device({ id: mockedDevice.id });

        try {
            device.removeNodeById('wrong');
        } catch (e) {
            expect(e.code).toBe(NOT_FOUND);
        }
    });

    test('POSITIVE: getTopics with settings', async () => {
        const device = new Device({ id: mockedDevice.id });

        device.onAttach(factory.homie);

        expect(device.getTopics(true)).toEqual({
            'sweet-home/device-id/$name'                              : '',
            'sweet-home/device-id/$fw/name'                           : '',
            'sweet-home/device-id/$fw/version'                        : '',
            'sweet-home/device-id/$localip'                           : '',
            'sweet-home/device-id/$mac'                               : '',
            'sweet-home/device-id/$implementation'                    : '',
            'sweet-home/device-id/$state'                             : '',
            'sweet-home/device-id/$telemetry'                         : '',
            'sweet-home/device-id/$options'                           : '',
            'sweet-home/device-id/$nodes'                             : '',
            'device-settings/sweet-home/device-id/$title'             : '',
            'device-settings/sweet-home/device-id/$last-heartbeat-at' : ''
        });
    });
});
