const EntitiesStore = require('./../../../lib/EntitiesStore');
const { ERROR_CODES: { NOT_SETTABLE, NOT_FOUND } } = require('./../../../lib/etc/config');

let entitiesStore;

jest.setTimeout(15000);

const scheme = [
    {
        rootTopic  : 'test-entity',
        type       : 'TEST_ENTITY',
        attributes : {
            name : {
                validation  : [ 'required', 'string' ],
                settable    : false,
                retained    : true,
                description : 'Entity name'
            },
            value : {
                settable    : true,
                retained    : true,
                description : ''
            }
        }
    }
];

describe('EntitiesStore index', () => {
    test('POSITIVE: entity class to be created', async () => {
        entitiesStore = new EntitiesStore({ scheme });
        expect(!!entitiesStore.classes.TEST_ENTITY).toBe(true);
    });

    test('NEGATIVE: entity to be created', async () => {
        try {
            entitiesStore = new EntitiesStore({
                scheme : [
                    {
                        rootTopic : '!test-entity'
                    }
                ]
            });
        } catch (err) {
            expect(err.fields).toEqual({
                attributes : 'REQUIRED',
                rootTopic  : 'WRONG_FORMAT',
                type       : 'REQUIRED'
            });
        }
    });

    test('POSITIVE: entity class to be deleted', async () => {
        entitiesStore.destroyEntity('TEST_ENTITY');
        expect(!!entitiesStore.classes.TEST_ENTITY).toBe(false);
    });

    test('POSITIVE: entity class to be initialized', async () => {
        entitiesStore.initializeEntity(scheme[0]);
        expect(!!entitiesStore.classes.TEST_ENTITY).toBe(true);
    });

    test('POSITIVE: subscribe to events', async () => {
        entitiesStore = new EntitiesStore({ scheme });
        const entity = new entitiesStore.classes.TEST_ENTITY({ id: 'valid-id' });

        entity.onAttributePublish(() => {});
        entity.onAttributeSet(() => {});
        entity.onErrorPublish(() => {});

        expect(!!entity._publishEventCallback).toBe(false);
        expect(!!entity._setEventCallback).toBe(false);
        expect(!!entity._errorEventCallback).toBe(false);
    });

    test('POSITIVE: Entity getTopics', async () => {
        entitiesStore = new EntitiesStore({ scheme });
        const entity = new entitiesStore.classes.TEST_ENTITY({ id: 'valid-id' });

        expect(entity.getTopics()).toEqual({
            'test-entity/valid-id/$name'  : '',
            'test-entity/valid-id/$value' : ''
        });
    });

    test('NEGATIVE: Entity setAttribute', async () => {
        entitiesStore = new EntitiesStore({ scheme });
        const entity = new entitiesStore.classes.TEST_ENTITY({ id: 'valid-id' });

        try {
            await entity.setAttribute('aaa', '');
        } catch (e) {
            expect(e.code).toBe(NOT_SETTABLE);
        }

        try {
            await entity.setAttribute('name', '');
        } catch (e) {
            expect(e.code).toBe(NOT_SETTABLE);
        }
    });

    test('NEGATIVE: Entity publishError', async () => {
        entitiesStore = new EntitiesStore({ scheme });
        const entity = new entitiesStore.classes.TEST_ENTITY({ id: 'valid-id' });

        try {
            entity.publishError('qweqwe', '');
        } catch (e) {
            expect(e.code).toBe(NOT_FOUND);
        }
    });

    test('POSITIVE: Entity publishAttribute forcePublish = false, value = Entity.value', async () => {
        entitiesStore = new EntitiesStore({ scheme });
        const entity = new entitiesStore.classes.TEST_ENTITY({ id: 'valid-id' });

        entity.updateAttribute({ name: 'some-name', value: 'value' });

        const t = await entity.publishAttribute('name', 'some-name', false);

        expect(t).toBe(undefined);
    });

    test('NEGATIVE: Entity publishAttribute', async () => {
        entitiesStore = new EntitiesStore({ scheme });
        const entity = new entitiesStore.classes.TEST_ENTITY({ id: 'valid-id' });

        try {
            await entity.publishAttribute('error', '');
        } catch (e) {
            expect(e.code).toBe(NOT_FOUND);
        }
    });
});
