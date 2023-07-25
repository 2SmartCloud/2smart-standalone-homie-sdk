const TestFactory = require('./../../utils');
const Threshold = require('./../../../lib/Threshold');
const Homie = require('./../../../lib/homie/Homie');
const { ERROR_CODES: { NOT_SETTABLE } } = require('./../../../lib/etc/config');

const mockedThreshold = require('./../../fixtures/__mocks__/objects/threshold');

const factory = new TestFactory();

jest.setTimeout(15000);

describe('Threshold class', () => {
    test('POSITIVE: create threshold instance', () => {
        const threshold = new Threshold(mockedThreshold);

        threshold.updateAttribute(mockedThreshold);

        expect(threshold instanceof Threshold).toBe(true);
    });

    test('NEGATIVE: invalid options: id, settable, retained, dataType', () => {
        let err;

        try {
            new Threshold({ id: '-invalid-id-' });
        } catch (e) {
            err = e;
        }

        expect(err.fields).toEqual({
            id : 'WRONG_FORMAT'
        });
    });

    test('POSITIVE: check serialize method', async () => {
        const threshold = new Threshold(mockedThreshold);

        threshold.updateAttribute(mockedThreshold);
        const serialized = threshold.serialize();

        expect(serialized).toMatchObject({
            id         : mockedThreshold.id,
            unit       : mockedThreshold.unit,
            dataType   : mockedThreshold.dataType,
            retained   : mockedThreshold.retained,
            settable   : mockedThreshold.settable,
            name       : mockedThreshold.name,
            value      : mockedThreshold.value,
            format     : mockedThreshold.format,
            scenarioId : mockedThreshold.scenarioId
        });
    });

    test('POSITIVE: check threshold getters', async () => {
        const threshold = new Threshold(mockedThreshold);

        threshold.updateAttribute(mockedThreshold);

        const id = threshold.getId();
        const name = threshold.getName();
        const value = threshold.getValue();
        const settable = threshold.getSettable();
        const retained = threshold.getRetained();
        const dataType = threshold.getDataType();
        const unit = threshold.getUnit();
        const format = threshold.getFormat();

        expect(id).toBe(mockedThreshold.id);
        expect(name).toBe(mockedThreshold.name);
        expect(value).toBe(mockedThreshold.value);
        expect(settable).toBe(mockedThreshold.settable);
        expect(retained).toBe(mockedThreshold.retained);
        expect(dataType).toBe(mockedThreshold.dataType);
        expect(unit).toBe(mockedThreshold.unit);
        expect(format).toBe(mockedThreshold.format);
    });

    test('POSITIVE: onAttach method', async () => {
        const threshold = new Threshold(mockedThreshold);

        threshold.onAttach(factory.homie);

        expect(threshold._homie instanceof Homie).toBe(true);
        expect(threshold._isAttached).toBe(true);
    });

    test('NEGATIVE: validation error', async () => {
        const threshold = new Threshold(mockedThreshold);
        let err;

        threshold.updateAttribute(mockedThreshold);
        try {
            threshold.updateAttribute({ settable: 'error' });
            // eslint-disable-next-line no-empty
        } catch (e) {}

        try {
            threshold.validateMyStructure();
        } catch (e) {
            err = e;
        }

        expect(err.fields).toEqual({ settable: 'NOT_ALLOWED_VALUE' });

        threshold.updateAttribute({
            settable : 'true',
            format   : '20:-10',
            value    : '1'
        });

        try {
            threshold.validateMyStructure();
        } catch (e) {
            err = e;
        }

        expect(err.fields).toEqual({ format: 'WRONG_FORMAT', value: 'WRONG_TYPE' });
    });

    test('POSITIVE: get topics', async () => {
        const threshold = new Threshold(mockedThreshold);
        const topics = threshold.getTopics();

        expect(typeof topics).toBe('object');
    });

    test('POSITIVE: delete method', async () => {
        const threshold = new Threshold(mockedThreshold);

        threshold._delete();

        expect(threshold.name).toBe('');
        expect(threshold.value).toBe('');
        expect(threshold.settable).toBe('');
        expect(threshold.retained).toBe('');
        expect(threshold.dataType).toBe('');
        expect(threshold.unit).toBe('');
        expect(threshold.format).toBe('');

        expect(threshold._isAttached).toBe(false);
        expect(threshold._isValid).toBe(false);
    });

    test('POSITIVE: _prepareResponseOptions', async () => {
        const threshold = new Threshold(mockedThreshold);
        const res = threshold._prepareResponseOptions();

        expect(res).toEqual({
            type : 'THRESHOLD',
            threshold
        });
    });

    test('POSITIVE: _getPublishEventName', async () => {
        const threshold = new Threshold(mockedThreshold);

        expect(threshold._getPublishEventName()).toEqual(`homie.publish.threshold.${mockedThreshold.scenarioId}.${mockedThreshold.id}`);
    });

    test('POSITIVE: getRootSettingTopic', async () => {
        const threshold = new Threshold(mockedThreshold);

        threshold.onAttach(factory.homie);

        expect(threshold.getRootSettingTopic()).toBe(`${factory.homie.scenarioSettingsTopic}/${threshold.getTopic()}`);
    });

    test('NEGATIVE: setSettingAttribute', async () => {
        const threshold = new Threshold(mockedThreshold);

        try {
            await threshold.setSettingAttribute('name');
        } catch (e) {
            expect(e.code).toEqual(NOT_SETTABLE);
        }
    });

    test('NEGATIVE: setAttribute', async () => {
        const threshold = new Threshold(mockedThreshold);

        try {
            threshold.setAttribute('name');
        } catch (e) {
            expect(e.code).toEqual(NOT_SETTABLE);
        }
    });

    test('POSITIVE: onAttributePublish with invalid state', async () => {
        const threshold = new Threshold(mockedThreshold);

        threshold.onAttributePublish(() => {});
        expect(!!threshold._publishEventCallback).toBe(false);
    });

    test('POSITIVE: getRootTopic with invalid state', async () => {
        const threshold = new Threshold(mockedThreshold);

        expect(threshold.getRootTopic()).toBe(`${threshold.scenarioId}/${threshold.id}`);
    });

    test('POSITIVE: getRootTopic with valid state', async () => {
        const threshold = new Threshold(mockedThreshold);

        threshold.onAttach(factory.homie);

        expect(threshold.getRootTopic()).toBe(`${factory.homie.scenarioTopic}/${threshold.scenarioId}/${threshold.id}`);
    });
});
