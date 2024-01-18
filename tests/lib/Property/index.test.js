const mockedProperty = require('./../../fixtures/__mocks__/objects/property');
const mockedDevice = require('./../../fixtures/__mocks__/objects/device');
const mockedNode = require('./../../fixtures/__mocks__/objects/node');
const mockedThreshold = require('./../../fixtures/__mocks__/objects/threshold.js');
const mockedScenario = require('./../../fixtures/__mocks__/objects/scenario');
const { ERROR_CODES: { NOT_SETTABLE } } = require('./../../../lib/etc/config');

const TestFactory = require('./../../utils');
const Property = require('./../../../lib/Property');
const Device = require('./../../../lib/Device');
const Node = require('./../../../lib/Node');
const Threshold = require('./../../../lib/Threshold');
const Scenario = require('./../../../lib/Scenario');
const Homie = require('./../../../lib/homie/Homie');

const factory = new TestFactory();

jest.setTimeout(15000);

describe('Property class', () => {
    test('POSITIVE: create property instance', async () => {
        const property = new Property({ id: mockedProperty.id });

        property.updateAttribute(mockedProperty);

        expect(property instanceof Property).toBe(true);
    });

    test('NEGATIVE: invalid options: id, settable, retained, dataType', async () => {
        let err;

        try {
            new Property({ id: '-invalid-id-' });
        } catch (e) {
            err = e;
        }

        expect(err.fields).toEqual({
            id : 'WRONG_FORMAT'
        });
    });

    test('NEGATIVE: invalid float/integer data type values', async () => {
        const invalidValue = {
            ...mockedProperty,
            value    : 'test',
            dataType : 'integer'
        };
        let err;

        try {
            const property = new Property({ id: invalidValue.id });

            property.updateAttribute(invalidValue);
            property.validateMyStructure();
        } catch (e) {
            err = e;
        }

        expect(err.fields).toEqual({ value: 'WRONG_TYPE' });
    });

    test('NEGATIVE: invalid float/integer data type format', async () => {
        const invalidFormat = {
            ...mockedProperty,
            dataType : 'integer',
            format   : 'rgb'
        };
        let err;

        try {
            const property = new Property({ id: invalidFormat.id });

            property.updateAttribute(invalidFormat);
            property.validateMyStructure();
        } catch (e) {
            err = e;
        }

        expect(err.fields).toEqual({ format: 'WRONG_FORMAT', value: 'WRONG_TYPE' });
    });

    test('NEGATIVE: invalid float/integer data type format 2', async () => {
        const invalidFormat = {
            ...mockedProperty,
            dataType : 'integer',
            format   : '4:0'
        };

        let err;

        try {
            const property = new Property({ id: invalidFormat.id });

            property.updateAttribute(invalidFormat);
            property.validateMyStructure();
        } catch (e) {
            err = e;
        }

        expect(err.fields).toEqual({ format: 'WRONG_FORMAT', value: 'WRONG_TYPE' });
    });

    test('POSITIVE: valid float/integer data type format 1', async () => {
        const invalidFormat = {
            ...mockedProperty,
            dataType : 'integer',
            format   : '-10:10',
            value    : '-5'
        };

        const property = new Property({ id: invalidFormat.id });

        property.updateAttribute(invalidFormat);
        property.validateMyStructure();

        expect(property.getValue()).toBe('-5');
    });

    test('POSITIVE: valid float/integer data type format 2', async () => {
        const invalidFormat = {
            ...mockedProperty,
            dataType : 'integer',
            format   : '-10:-2',
            value    : '-5'
        };

        const property = new Property({ id: invalidFormat.id });

        property.updateAttribute(invalidFormat);
        property.validateMyStructure();

        expect(property.getValue()).toBe('-5');
    });

    test('NEGATIVE: invalid boolean data type value', async () => {
        const invalidValue = {
            ...mockedProperty,
            value    : 'test',
            dataType : 'boolean'
        };
        let err;

        try {
            const property = new Property({ id: invalidValue.id });

            property.updateAttribute(invalidValue);
            property.validateMyStructure();
        } catch (e) {
            err = e;
        }

        expect(err.fields).toEqual({ value: 'WRONG_TYPE' });
    });

    test('NEGATIVE: invalid enum data type format', async () => {
        const invalidValue = {
            ...mockedProperty,
            dataType : 'enum',
            format   : ''
        };
        let err;

        try {
            const property = new Property({ id: invalidValue.id });

            property.updateAttribute(invalidValue);
            property.validateMyStructure();
        } catch (e) {
            err = e;
        }

        expect(err.fields).toEqual({ format: 'WRONG_FORMAT', value: 'WRONG_TYPE' });
    });

    test('NEGATIVE: invalid color data type format', async () => {
        const invalidValue = {
            ...mockedProperty,
            dataType : 'color',
            format   : ''
        };
        let err;

        try {
            const property = new Property({ id: invalidValue.id });

            property.updateAttribute(invalidValue);
            property.validateMyStructure();
        } catch (e) {
            err = e;
        }

        expect(err.fields).toEqual({ format: 'WRONG_FORMAT', value: 'WRONG_TYPE' });
    });

    test('NEGATIVE: invalid color data type format 2', async () => {
        const invalidValue = {
            ...mockedProperty,
            dataType : 'color',
            format   : 'rgba'
        };
        let err;

        try {
            const property = new Property({ id: invalidValue.id });

            property.updateAttribute(invalidValue);
            property.validateMyStructure();
        } catch (e) {
            err = e;
        }

        expect(err.fields).toEqual({ format: 'WRONG_FORMAT', value: 'WRONG_TYPE' });
    });

    test('POSITIVE: check serialize method', async () => {
        const property = new Property(mockedProperty);

        property.updateAttribute(mockedProperty);
        const serialized = property.serialize();

        expect(serialized).toMatchObject({
            id       : mockedProperty.id,
            unit     : mockedProperty.unit,
            dataType : mockedProperty.dataType,
            retained : mockedProperty.retained,
            settable : mockedProperty.settable,
            name     : mockedProperty.name,
            value    : mockedProperty.value,
            format   : mockedProperty.format,
            groups   : []
        });
    });

    test('POSITIVE: check property getters', async () => {
        const property = new Property(mockedProperty);

        property.updateAttribute(mockedProperty);

        const id = property.getId();
        const name = property.getName();
        const value = property.getValue();
        const settable = property.getSettable();
        const retained = property.getRetained();
        const dataType = property.getDataType();
        const unit = property.getUnit();
        const format = property.getFormat();
        const title = property.getTitle();

        expect(id).toBe(mockedProperty.id);
        expect(name).toBe(mockedProperty.name);
        expect(value).toBe(mockedProperty.value);
        expect(settable).toBe(mockedProperty.settable);
        expect(retained).toBe(mockedProperty.retained);
        expect(dataType).toBe(mockedProperty.dataType);
        expect(unit).toBe(mockedProperty.unit);
        expect(format).toBe(mockedProperty.format);
        expect(title).toBe('');
    });

    test('POSITIVE: onAttach method', async () => {
        const property = new Property({ id: mockedProperty.id });

        property.onAttach(factory.homie);

        expect(property._homie instanceof Homie).toBe(true);
        expect(property._isAttached).toBe(true);
    });

    test('POSITIVE: get parent instances', async () => {
        const device = new Device({ id: mockedDevice.id });
        const node = new Node({ id: mockedNode.id });
        const property = new Property({ id: mockedProperty.id });

        device.addNode(node);
        node.addSensor(property);

        expect(property.getDevice()).toEqual(device);
        expect(property.getNode()).toEqual(node);
        expect(property.getDeviceId()).toBe(mockedDevice.id);
        expect(property.getNodeId()).toBe(mockedNode.id);
    });

    test('NEGATIVE: get parent device id', async () => {
        const property = new Property(mockedProperty);
        let err;

        try {
            property.getDeviceId();
        } catch (e) {
            err = e;
        }

        expect(err.fields).toEqual({ device: 'NOT_FOUND' });
    });

    test('NEGATIVE: get parent node id', async () => {
        const property = new Property(mockedProperty);
        let err;

        try {
            property.getNodeId();
        } catch (e) {
            err = e;
        }

        expect(err.fields).toEqual({ node: 'NOT_FOUND' });
    });

    test('POSITIVE: set value', async () => {
        const property = new Property({ id: mockedProperty.id });

        property.setValue('success');

        expect(property.getValue()).toBe('success');
    });

    test('NEGATIVE: validation error', async () => {
        const property = new Property(mockedProperty);
        let err;

        property.updateAttribute(mockedProperty);
        try {
            property.updateAttribute({ settable: 'error' });
            // eslint-disable-next-line no-empty
        } catch (e) {}

        try {
            property.validateMyStructure();
        } catch (e) {
            err = e;
        }

        expect(err.fields).toEqual({ settable: 'NOT_ALLOWED_VALUE' });

        property.updateAttribute({
            settable : 'true',
            format   : '20:-10',
            value    : '1'
        });

        try {
            property.validateMyStructure();
        } catch (e) {
            err = e;
        }

        expect(err.fields).toEqual({ format: 'WRONG_FORMAT', value: 'WRONG_TYPE' });
    });

    test('NEGATIVE: setAttribute', async () => {
        const property = new Property(mockedProperty);

        try {
            property.setAttribute('name');
        } catch (e) {
            expect(e.code).toEqual(NOT_SETTABLE);
        }
    });

    test('POSITIVE: addGroup for device', async () => {
        const device = new Device({ id: mockedDevice.id });
        const node = new Node({ id: mockedNode.id });
        const property = new Property({ id: mockedProperty.id });

        device.addNode(node);
        node.addSensor(property);

        property.addGroup('group-id');
        expect(property.groups.includes('group-id')).toBe(true);
    });

    test('POSITIVE: addGroup for threshold', async () => {
        const scenario = new Scenario({ id: mockedScenario.id });
        const threshold = new Threshold({ id: mockedThreshold.id, scenarioId: mockedScenario.id });

        scenario.addThreshold(threshold);

        threshold.addGroup('group-id');
        expect(threshold.groups.includes('group-id')).toBe(true);
    });

    test('POSITIVE: deleteGroup for threshold', async () => {
        const scenario = new Scenario({ id: mockedScenario.id });
        const threshold = new Threshold({ id: mockedThreshold.id, scenarioId: mockedScenario.id });

        scenario.addThreshold(threshold);

        threshold.deleteGroup('group-id');
        expect(threshold.groups.includes('group-id')).toBe(false);
    });

    test('POSITIVE: deleteGroup', async () => {
        const device = new Device({ id: mockedDevice.id });
        const node = new Node({ id: mockedNode.id });
        const property = new Property({ id: mockedProperty.id });

        device.addNode(node);
        node.addSensor(property);

        property.deleteGroup('group-id');
        expect(property.groups.includes('group-id')).toBe(false);
    });

    test('POSITIVE: setScenario', async () => {
        const scenario = new Scenario({ id: mockedScenario.id });
        const property = new Property({ id: mockedProperty.id });

        property.setScenario(scenario);

        expect(property.scenario instanceof Scenario).toBeTruthy();
    });

    test('POSITIVE: unsetScenario', async () => {
        const scenario = new Scenario({ id: mockedScenario.id });
        const property = new Property({ id: mockedProperty.id });

        property.setScenario(scenario);
        property.unsetScenario(scenario);

        expect(property.scenario).toBeNull();
    });

    test('POSITIVE: __prepareRequestOptions for device', async () => {
        const device = new Device({ id: mockedDevice.id });
        const node = new Node({ id: mockedNode.id });
        const property = new Property({ id: mockedProperty.id });

        device.addNode(node);
        node.addSensor(property);

        expect(property._prepareRequestOptions()).toEqual({
            deviceId   : 'device-id',
            nodeId     : 'thermometer',
            propertyId : 'temperature-sensor',
            type       : 'SENSOR'
        });
    });

    test('POSITIVE: __prepareRequestOptions for threshold', async () => {
        const scenario = new Scenario({ id: mockedScenario.id });
        const threshold = new Threshold({ id: mockedThreshold.id, scenarioId: mockedScenario.id });

        scenario.addThreshold(threshold);

        expect(threshold._prepareRequestOptions()).toEqual({
            propertyId  : 'threshold',
            scenarioId  : 'scenario-test',
            thresholdId : 'threshold',
            type        : 'THRESHOLD'
        });
    });

    test('NEGATIVE: subscribe instance to events', async () => {
        const property = new Property({ id: mockedProperty.id });

        property._subscribeInstanceToEvents();

        expect(!!property._publishEventCallback).toBe(false);
        expect(!!property._setEventCallback).toBe(false);
        expect(!!property._errorEventCallback).toBe(false);
    });

    test('NEGATIVE: subscribe to events', async () => {
        const property = new Property({ id: mockedProperty.id });

        property._subscribeToPublish();
        property._subscribeToSet();
        property._subscribeToError();

        expect(!!property._publishEventCallback).toBe(false);
        expect(!!property._setEventCallback).toBe(false);
        expect(!!property._errorEventCallback).toBe(false);
    });

    test('POSITIVE: getTopics with settings', async () => {
        const device = new Device({ id: mockedDevice.id });
        const node = new Node({ id: mockedNode.id });
        const property = new Property({ id: mockedProperty.id });

        device.addNode(node);
        node.addSensor(property);
        property.onAttach(factory.homie);

        expect(property.getTopics(true)).toEqual({
            'sweet-home/device-id/thermometer/temperature-sensor/$name'                      : '',
            'sweet-home/device-id/thermometer/temperature-sensor'                            : '',
            'sweet-home/device-id/thermometer/temperature-sensor/$settable'                  : '',
            'sweet-home/device-id/thermometer/temperature-sensor/$retained'                  : 'true',
            'sweet-home/device-id/thermometer/temperature-sensor/$datatype'                  : 'string',
            'sweet-home/device-id/thermometer/temperature-sensor/$unit'                      : '#',
            'sweet-home/device-id/thermometer/temperature-sensor/$format'                    : '',
            'device-settings/sweet-home/device-id/thermometer/temperature-sensor/$title'     : '',
            'device-settings/sweet-home/device-id/thermometer/temperature-sensor/$groups'    : '',
            'device-settings/sweet-home/device-id/thermometer/temperature-sensor/$displayed' : ''
        });
    });

    test('NEGATIVE: setSettingAttirbute', async () => {
        const property = new Property({ id: mockedProperty.id });

        try {
            property.setSettingAttribute('wrong');
        } catch (e) {
            expect(e.code).toBe(NOT_SETTABLE);
        }
    });
});
