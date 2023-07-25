const mockedScenario = require('../../fixtures/__mocks__/objects/scenario');
const mockedThreshold = require('../../fixtures/__mocks__/objects/threshold');

const { ERROR_CODES: { WRONG_FORMAT, EXISTS, NOT_FOUND, NOT_SETTABLE } } = require('../../../lib/etc/config');

const TestFactory = require('../../utils');
const Homie = require('../../../lib/homie/Homie');
const Scenario = require('../../../lib/Scenario');
const Threshold = require('../../../lib/Threshold');

const factory = new TestFactory();

jest.setTimeout(15000);

describe('Scenario class', () => {
    test('POSITIVE: create scenario instance', () => {
        const scenario = new Scenario({ id: mockedScenario.id });
        const isScenarioInstance = scenario instanceof Scenario;

        expect(isScenarioInstance).toBe(true);

        scenario.updateAttribute({ state: mockedScenario.state });

        scenario.validateMyStructure();

        expect(scenario._isValid).toBe(true);
    });

    test('NEGATIVE: invalid options: id, state', () => {
        const invalidScenario = {
            ...mockedScenario,
            id    : '-invalid-id-',
            state : '-not-a-boolean-'
        };

        try {
            new Scenario(invalidScenario);
        } catch (err) {
            expect(err.fields).toEqual({ id: WRONG_FORMAT });
        }
    });

    test('POSITIVE: check serialize method', async () => {
        const scenario = new Scenario({ id: mockedScenario.id });
        const threshold = new Threshold({ id: mockedThreshold.id, scenarioId: mockedScenario.id });

        scenario.updateAttribute({ state: mockedScenario.state });
        threshold.updateAttribute(mockedThreshold);

        scenario.validateMyStructure();
        threshold.validateMyStructure();

        scenario.addThreshold(threshold);

        scenario.onAttach(factory.homie);

        const serialized = scenario.serialize();

        expect(Array.isArray(serialized.thresholds)).toBe(true);
        expect(serialized.thresholds.length).toBe(1);

        delete serialized.thresholds;

        expect(serialized).toMatchObject({
            id        : mockedScenario.id,
            state     : mockedScenario.state,
            rootTopic : `scenarios/${mockedScenario.id}`
        });
    });

    test('POSITIVE: check scenario getters', async () => {
        const scenario = new Scenario({ id: mockedScenario.id });

        scenario.updateAttribute({ state: mockedScenario.state });

        const id = scenario.getId();
        const state = scenario.getState();
        const thresholds = scenario.getThresholds();

        expect(id).toEqual(mockedScenario.id);
        expect(state).toEqual(mockedScenario.state);

        expect(Array.isArray(thresholds)).toBe(true);
    });

    test('NEGATIVE: invalid id for getThresholdById methods', async () => {
        const scenario = new Scenario(mockedScenario);

        try {
            scenario.getThresholdById('wrong-id');
        } catch (err) {
            expect(err.fields).toEqual({ threshold: 'NOT_FOUND' });
        }
    });

    test('POSITIVE: onAttach method', async () => {
        const scenario = new Scenario(mockedScenario);

        scenario.onAttach(factory.homie);

        expect(scenario._homie instanceof Homie).toBe(true);
        expect(scenario._isAttached).toBe(true);
    });

    test('POSITIVE: add threshold', async () => {
        const scenario = new Scenario({ id: mockedScenario.id });
        const threshold = new Threshold({ id: mockedThreshold.id, scenarioId: mockedScenario.id });

        threshold.updateAttribute(mockedThreshold);
        scenario.updateAttribute({ state: mockedScenario.state });

        scenario.validateMyStructure();
        threshold.validateMyStructure();

        scenario.addThreshold(threshold);

        const thresholdById = scenario.getThresholdById(mockedThreshold.id);

        expect(Boolean(thresholdById)).toBe(true);
    });

    test('NEGATIVE: add threshold that already exists', async () => {
        const scenario = new Scenario({ id: mockedScenario.id });
        const threshold = new Threshold({ id: mockedThreshold.id, scenarioId: mockedScenario.id });

        scenario.addThreshold(threshold);

        try {
            scenario.addThreshold(threshold);
        } catch (err) {
            expect(err.fields).toEqual({ threshold: EXISTS });
        }
    });

    test('NEGATIVE: add threshold with wrong format', async () => {
        const scenario = new Scenario({ id: mockedScenario.id });

        try {
            scenario.addThreshold(mockedThreshold);
        } catch (err) {
            expect(err.fields).toEqual({ threshold: WRONG_FORMAT });
        }
    });

    test('POSITIVE: delete scenario', () => {
        const scenario = new Scenario({ id: mockedScenario.id });

        scenario.updateAttribute({ state: mockedScenario.state });

        scenario.delete();

        expect(scenario.state).toBe(null);
        expect(scenario.thresholds).toEqual([]);

        expect(scenario._isValid).toBe(false);
        expect(scenario._isAttached).toBe(false);

        expect(scenario._publishEventCallback).toBe(null);
        expect(scenario._setEventCallback).toBe(null);
        expect(scenario._errorEventCallback).toBe(null);
    });

    test('POSITIVE: _errorHandler', async () => {
        let res;
        const scenario = new Scenario({ id: mockedScenario.id });

        scenario._errorEventCallback = data => res = data;
        scenario._errorHandler({ state: 'ERROR' });

        expect(res).toMatchObject({ type: 'SCENARIO', field: 'state' });
    });

    test('POSITIVE: _setHandler', async () => {
        let res;
        const scenario = new Scenario({ id: mockedScenario.id });

        scenario._setEventCallback = data => res = data;
        scenario._setHandler({ state: 'set-state' });

        expect(res).toMatchObject({ type: 'SCENARIO', field: 'state' });
    });

    test('NEGATIVE: subscribe to events', async () => {
        const scenario = new Scenario({ id: mockedScenario.id });

        scenario.onAttributePublish(() => {});
        scenario.onAttributeSet(() => {});
        scenario.onErrorPublish(() => {});

        expect(!!scenario._publishEventCallback).toBe(false);
        expect(!!scenario._setEventCallback).toBe(false);
        expect(!!scenario._errorEventCallback).toBe(false);
    });

    test('NEGATIVE: setSettingAttribute', async () => {
        const scenario = new Scenario({ id: mockedScenario.id });

        try {
            await scenario.setSettingAttribute('name');
        } catch (e) {
            expect(e.code).toEqual(NOT_SETTABLE);
        }
    });

    test('POSITIVE: getRootSettingTopic', async () => {
        const threshold = new Threshold(mockedThreshold);

        threshold.onAttach(factory.homie);

        expect(threshold.getRootSettingTopic()).toBe(`${factory.homie.scenarioSettingsTopic}/${threshold.getTopic()}`);
    });

    test('POSITIVE: getMapByGroupId', async () => {
        const scenario = new Scenario({ id: mockedScenario.id });

        scenario._updateGroupMap({ type: 'THRESHOLD', groupId: 'test', scenarioId: mockedScenario.id, propertyId: 's-1' });
        expect(!!scenario.getMapByGroupId('test')).toBe(true);
    });

    test('POSITIVE: deleteMapByGroupId', async () => {
        const scenario = new Scenario({ id: mockedScenario.id });

        scenario._updateGroupMap({ type: 'THRESHOLD', groupId: 'test', scenarioId: mockedScenario.id, propertyId: 's-1' });
        scenario.deleteMapByGroupId('test');
        expect(!!scenario.getMapByGroupId('test')).toBe(false);
    });

    test('POSITIVE: delete thresholds', async () => {
        const scenario = new Scenario({ id: mockedScenario.id });
        const threshold = new Threshold({ id: mockedThreshold.id, scenarioId: mockedScenario.id });

        scenario.addThreshold(threshold);
        scenario.removeThresholdById(threshold.getId());

        expect(!!scenario.thresholds.find(th => th.id === mockedThreshold.id)).toBe(false);
    });

    test('NEGATIVE: delete thresholds', async () => {
        const scenario = new Scenario({ id: mockedScenario.id });

        try {
            scenario.removeThresholdById('wrong');
        } catch (e) {
            expect(e.code).toBe(NOT_FOUND);
        }
    });

    test('POSITIVE: getTopics allTopics = true', async () => {
        const scenario = new Scenario({ id: mockedScenario.id, state: mockedScenario.state });
        const threshold = new Threshold({ id: mockedThreshold.id, scenarioId: mockedScenario.id });

        scenario.updateAttribute({ state: mockedScenario.state });
        scenario.addThreshold(threshold);
        scenario.onAttach(factory.homie);

        expect(scenario.getTopics(true)).toEqual({
            'scenarios/scenario-test/$state'              : 'false',
            'scenarios/scenario-test/$thresholds'         : 'threshold',
            'scenarios/scenario-test/threshold/$name'     : '',
            'scenarios/scenario-test/threshold/$settable' : '',
            'scenarios/scenario-test/threshold/$retained' : 'true',
            'scenarios/scenario-test/threshold/$datatype' : 'string',
            'scenarios/scenario-test/threshold/$unit'     : '#',
            'scenarios/scenario-test/threshold/$format'   : '',
            'scenarios/scenario-test/threshold'           : ''
        });
    });

    test('POSITIVE: getTopics allTopics = false', async () => {
        const scenario = new Scenario({ id: mockedScenario.id, state: mockedScenario.state });
        const threshold = new Threshold({ id: mockedThreshold.id, scenarioId: mockedScenario.id });

        scenario.updateAttribute({ state: mockedScenario.state });
        scenario.addThreshold(threshold);
        scenario.onAttach(factory.homie);

        expect(scenario.getTopics()).toEqual({
            'scenarios/scenario-test/$state' : 'false'
        });
    });
});
