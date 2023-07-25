const Debugger = require('./../../lib/utils/debugger');
const X = require('./../../lib/utils/X');

jest.setTimeout(15000);
let debug = null;

let recvMsg;
let recvLvl;

const logger = (message, level) => {
    try {
        recvMsg = JSON.parse(message);
    } catch (e) {
        recvMsg = message;
    }
    recvLvl = level;
};

describe('Debugger class', () => {
    test('POSITIVE: new', () => {
        debug = new Debugger('*', logger);
        debug.initEvents();
    });

    test('POSITIVE: call', () => {
        let called = false;

        debug.on('test', () => called = true);
        debug.send('test');
        expect(called).toBe(true);
    });

    test('POSITIVE: info', async () => {
        debug.info('test');

        expect(recvMsg).toBe('test');
        expect(recvLvl).toBe('info');

        debug.info('test', 'message');

        expect(!!recvMsg).toBe(true);
        expect(recvLvl).toBe('info');

        debug.info('test', {});

        expect(!!recvMsg).toBe(true);
        expect(recvLvl).toBe('info');
    });

    test('POSITIVE: warning', async () => {
        debug.warning('warning.address');

        expect(!!recvMsg).toBe(true);
        expect(recvLvl).toBe('warning');

        let warnObj = { code: 'ERROR', message: 'Some Text' };

        debug.warning('test', warnObj);

        expect(!!recvMsg).toBe(true);
        expect(recvLvl).toBe('warning');

        warnObj = new Error('new Error()');

        debug.warning('test', warnObj);

        expect(!!recvMsg).toBe(true);
        expect(recvLvl).toBe('warning');

        const xObj = { code: 'ERROR', message: 'Some Text', fields: { field: 'WRONG_TYPE' } };

        warnObj = new X(xObj);

        debug.warning('test', warnObj);

        expect(!!recvMsg).toBe(true);
        expect(recvLvl).toBe('warning');
    });

    test('POSITIVE: error', async () => {
        debug.error('ERROR message');

        expect(!!recvMsg).toBe(true);
        expect(recvLvl).toBe('error');

        let errObj = { code: 'ERROR', message: 'Some Text' };

        debug.error(errObj);

        expect(!!recvMsg).toBe(true);
        expect(recvLvl).toBe('error');

        errObj = new Error('new Error()');

        debug.error(errObj);

        expect(!!recvMsg).toBe(true);
        expect(recvLvl).toBe('error');

        const xObj = { code: 'ERROR', message: 'Some Text', fields: { field: 'WRONG_TYPE' } };

        errObj = new X(xObj);

        debug.error(errObj);

        expect(!!recvMsg).toBe(true);
        expect(recvLvl).toBe('error');
    });

    test('POSITIVE: ignore', () => {
        let called = false;

        debug.on('test', () => called = true);
        debug.ignore('test');
        debug.ignore('test.*');
        expect(debug.isIgnored('test.test')).toBe(true);
        expect(debug.isIgnored('test2.test')).toBe(false);
        debug.send('test');
        expect(called).toBe(false);
    });
});
