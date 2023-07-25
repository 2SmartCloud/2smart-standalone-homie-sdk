const mockedDeviceObj = require('../../fixtures/__mocks__/objects/device');
const mockedNodeObj = require('../../fixtures/__mocks__/objects/node');
const mockedPropertyObj = require('../../fixtures/__mocks__/objects/property');

const mockedDeviceTopics = require('../../fixtures/__mocks__/topics/device');
const mockedNodeTopics = require('../../fixtures/__mocks__/topics/node');
const mockedPropertyTopics = require('../../fixtures/__mocks__/topics/property');

const { translateObjToTopic, translateTopicToObj } = require('./../../../lib/etl/index');

jest.setTimeout(5000);

describe('ETL: object to topic', () => {
    test('POSITIVE: transform DEVICE entity', () => {
        const result = translateObjToTopic('DEVICE', mockedDeviceObj, 'base-topic');
        const nodeIds = mockedDeviceObj.nodes.map(n => n.id);
        const telemetryIds = mockedDeviceObj.telemetry.map(t => t.id);
        const optionIds = mockedDeviceObj.options.map(o => o.id);

        expect(result).toEqual({
            'base-topic/$name'           : mockedDeviceObj.name,
            'base-topic/$localip'        : mockedDeviceObj.localIp,
            'base-topic/$mac'            : mockedDeviceObj.mac,
            'base-topic/$fw/name'        : mockedDeviceObj.firmwareName,
            'base-topic/$fw/version'     : mockedDeviceObj.firmwareVersion,
            'base-topic/$implementation' : mockedDeviceObj.implementation,
            'base-topic/$state'          : mockedDeviceObj.state,
            'base-topic/$nodes'          : nodeIds.join(','),
            'base-topic/$telemetry'      : telemetryIds.join(','),
            'base-topic/$options'        : optionIds.join(',')
        });
    });

    test('POSITIVE: transform NODE entity', () => {
        const result = translateObjToTopic('NODE', mockedNodeObj, 'base-topic');
        const sensorIds = mockedNodeObj.sensors.map(s => s.id);
        const telemetryIds = mockedNodeObj.telemetry.map(t => t.id);
        const optionIds = mockedNodeObj.options.map(o => o.id);

        expect(result).toEqual({
            'base-topic/$name'          : mockedNodeObj.name,
            'base-topic/$type'          : mockedNodeObj.type,
            'base-topic/$state'         : mockedNodeObj.state,
            'base-topic/$last-activity' : mockedNodeObj.lastActivity,
            'base-topic/$array'         : mockedNodeObj.range,
            'base-topic/$telemetry'     : telemetryIds.join(','),
            'base-topic/$options'       : optionIds.join(','),
            'base-topic/$properties'    : sensorIds.join(',')
        });
    });

    test('POSITIVE: transform PROPERTY entity', () => {
        const result = translateObjToTopic('PROPERTY', mockedPropertyObj, 'base-topic');

        expect(result).toEqual({
            'base-topic'           : mockedPropertyObj.value,
            'base-topic/$name'     : mockedPropertyObj.name,
            'base-topic/$settable' : mockedPropertyObj.settable,
            'base-topic/$retained' : mockedPropertyObj.retained,
            'base-topic/$datatype' : mockedPropertyObj.dataType,
            'base-topic/$unit'     : mockedPropertyObj.unit,
            'base-topic/$format'   : mockedPropertyObj.format
        });
    });

    test('POSITIVE: validate SENSOR entity', () => {
        const result = translateObjToTopic('SENSOR', mockedPropertyObj, 'base-topic');

        expect(result).toEqual({
            'base-topic'           : mockedPropertyObj.value,
            'base-topic/$name'     : mockedPropertyObj.name,
            'base-topic/$settable' : mockedPropertyObj.settable,
            'base-topic/$retained' : mockedPropertyObj.retained,
            'base-topic/$datatype' : mockedPropertyObj.dataType,
            'base-topic/$unit'     : mockedPropertyObj.unit,
            'base-topic/$format'   : mockedPropertyObj.format
        });
    });

    test('NEGATIVE: wrong entity', () => {
        let err;

        try {
            translateObjToTopic('wrong', { name: 'field name' }, 'base-topic');
        } catch (e) {
            err = e;
        }
        expect(err.fields).toEqual({ entity: 'WRONG_TYPE' });
    });

    test('NEGATIVE: empty base topic', () => {
        let err;

        try {
            translateObjToTopic('DEVICE', { name: 'field name' });
        } catch (e) {
            err = e;
        }
        expect(err.fields).toEqual({ baseTopic: 'REQUIRED' });
    });
});

describe('ETL: topic to object', () => {
    test('POSITIVE: transform DEVICE entity', () => {
        const result = Object.keys(mockedDeviceTopics).map(topic => {
            return translateTopicToObj('DEVICE', { property: topic, value: mockedDeviceTopics[topic] });
        });

        expect(result).toEqual([
            { name: mockedDeviceTopics.$name },
            { localIp: mockedDeviceTopics.$localip },
            { mac: mockedDeviceTopics.$mac },
            { firmwareName: mockedDeviceTopics['$fw/name'] },
            { firmwareVersion: mockedDeviceTopics['$fw/version'] },
            { implementation: mockedDeviceTopics.$implementation },
            { state: mockedDeviceTopics.$state },
            { nodes: [ 'node-1', 'node-2' ] },
            { telemetry: [ 'telemetry-1', 'telemetry-2' ] },
            { options: [ 'option-1', 'option-2' ] }
        ]);
    });

    test('POSITIVE: transform NODE entity', () => {
        const result = Object.keys(mockedNodeTopics).map(topic => {
            return translateTopicToObj('NODE', { property: topic, value: mockedNodeTopics[topic] });
        });

        expect(result).toEqual([
            { name: mockedNodeTopics.$name },
            { type: mockedNodeTopics.$type },
            { state: mockedNodeTopics.$state },
            { range: mockedNodeTopics.$array },
            { telemetry: [ 'telemetry-1', 'telemetry-2' ] },
            { options: [ 'option-1', 'option-2' ] },
            { sensors: [ 'sensor-1' ] }
        ]);
    });

    test('POSITIVE: transform PROPERTY entity', () => {
        const result = Object.keys(mockedPropertyTopics).map(topic => {
            return translateTopicToObj('PROPERTY', { property: topic, value: mockedPropertyTopics[topic] });
        });

        expect(result).toEqual([
            { value: mockedPropertyTopics.$value },
            { name: mockedPropertyTopics.$name },
            { settable: mockedPropertyTopics.$settable },
            { retained: mockedPropertyTopics.$retained },
            { dataType: mockedPropertyTopics.$datatype },
            { unit: mockedPropertyTopics.$unit },
            { format: mockedPropertyTopics.$format }
        ]);
    });

    test('NEGATIVE: wrong entity', () => {
        let err;

        try {
            translateTopicToObj('wrong', { name: 'field name' });
        } catch (e) {
            err = e;
        }

        expect(err.fields).toEqual({ entity: 'WRONG_TYPE' });
    });
});
