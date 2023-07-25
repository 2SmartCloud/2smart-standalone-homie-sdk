const ERRORS = require('./../../../lib/utils/errors');

jest.setTimeout(15000);

describe('Error classes', () => {
    test('POSITIVE: ERRORS.UNKNOWN_ERROR to be defined', () => {
        expect(!!(ERRORS && ERRORS.UNKNOWN_ERROR)).toBe(true);
    });

    test('POSITIVE: create empty error', () => {
        const UNKNOWN_ERROR = ERRORS.UNKNOWN_ERROR;

        expect(new UNKNOWN_ERROR()).toMatchObject({
            message : 'Something went wrong',
            code    : 'ERROR',
            fields  : {}
        });
        expect(new UNKNOWN_ERROR('Hello there')).toMatchObject({
            message : 'Hello there',
            code    : 'ERROR',
            fields  : {}
        });
        expect(new UNKNOWN_ERROR({
            message : 'General Kenobi'
        })).toMatchObject({
            message : 'General Kenobi',
            fields  : {}
        });
    });
});
