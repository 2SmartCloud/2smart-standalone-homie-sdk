const Debugger = require('./../../../lib/utils/debugger');

jest.setTimeout(15000);
let debug = null;

describe('Debugger class', () => {
    test('POSITIVE: new', () => {
        debug = new Debugger();
    });

    test('POSITIVE: call', () => {
        debug = new Debugger();
        let called = false;

        debug.on('test', () => called = true);
        debug.send('test');
        expect(called).toBe(true);
    });

    test('POSITIVE: ignore', () => {
        debug = new Debugger();
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
