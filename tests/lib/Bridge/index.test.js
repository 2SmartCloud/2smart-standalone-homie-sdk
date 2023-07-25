const Promise = require('bluebird');
const TestFactory = require('./../../utils');
const HomieMigrator = require('./../../../lib/homie/HomieMigrator');

const factory = new TestFactory();
const { bridgeFactory } = factory;
const mqttConnection = {
    ...factory.mqttConnection,
    rootTopic : factory.rootTopic
};
let homie;

jest.setTimeout(15000);

/* eslint-disable more/no-numeric-endings-for-variables */
/* eslint-disable camelcase*/
describe('Bridge classes', () => {
    beforeAll(async () => {
        await factory.init();

        homie = factory.homie;
    });

    afterAll(async () => {
        await factory.end();
    });
    test('NEGATIVE: unauthorized exit', async () => {
        const uri = process.env.ENV_MODE === 'test' ? 'ws://emqx-emqx:8083/mqtt' : 'ws://localhost:8083/mqtt';
        const bridge = new bridgeFactory.BaseBridge({
            mqttConnection : {
                username  : '',
                password  : '',
                uri,
                rootTopic : factory.rootTopic
            },
            device : new bridgeFactory.BaseDeviceBridge({
                id : 'deviceid'
            })
        });

        // eslint-disable-next-line no-unused-vars
        bridge.on('error', (error) => {
            // console.log(error);
        });
        bridge.init();
        let was_forced = false;

        const exit = await new Promise((resolve) => {
            // eslint-disable-next-line camelcase
            bridge.on('exit', (reason, exit_code) => {
                expect(reason).toBe('Connection refused: Not authorized');
                expect(exit_code).toBe(1);
                resolve(true);
            });
            setTimeout(() => resolve(false), 3000);
            // as ci/cd are running using default emqx
            setTimeout(() => {
                was_forced = true;
                bridge.handleHomieError(new Error('Connection refused: Not authorized'));
            }, 1000);
        });

        expect(exit).toBe(true);

        let wassynced;

        if (!exit && was_forced) {
            wassynced = await new Promise((resolve) => {
                if (bridge.homie.synced) return resolve(true);
                const func = () => {
                    clearTimeout(timeout);
                    bridge.homie.off('synced', func);
                    expect(bridge.homie.synced).toBe(true);
                    resolve(true);
                };

                bridge.homie.on('synced', func);
                const timeout = setTimeout(() => {
                    clearTimeout(timeout);
                    bridge.homie.off('synced', func);
                    resolve(false);
                }, 4000);

                bridge.init();
            });

            expect(wassynced).toBe(true);
        }

        bridge.destroy();
    });

    test('POSITIVE: create device with nodes and props', async () => {
        const device =  new bridgeFactory.BaseDeviceBridge({
            id        : 'deviceid',
            options   : [ new bridgeFactory.BasePropertyBridge({ id: 'deviceoptionid1' }, { type: 'option' }) ],
            telemetry : [ new bridgeFactory.BasePropertyBridge({ id: 'devicetelemetryid1' }, { type: 'telemetry' }) ],
            nodes     : [ new bridgeFactory.BaseNodeBridge({ id: 'nodeid1' }) ]
        });
        const deviceoption =  new bridgeFactory.BasePropertyBridge({ id: 'deviceoptionid2' }, { type: 'option' });
        const devicetelemetry =  new bridgeFactory.BasePropertyBridge({ id: 'devicetelemetryid2' }, { type: 'telemetry' });
        const node =  new bridgeFactory.BaseNodeBridge({
            id        : 'nodeid2',
            options   : [ new bridgeFactory.BasePropertyBridge({ id: 'nodeoptionid1' }, { type: 'option' }) ],
            telemetry : [ new bridgeFactory.BasePropertyBridge({ id: 'nodetelemetryid1' }, { type: 'telemetry' }) ],
            sensors   : [ new bridgeFactory.BasePropertyBridge({ id: 'nodesensorid1' }, { type: 'sensor' }) ]
        });
        const nodeoption =  new bridgeFactory.BasePropertyBridge({ id: 'nodeoptionid2' }, { type: 'option' });
        const nodetelemetry =  new bridgeFactory.BasePropertyBridge({ id: 'nodetelemetry2' }, { type: 'telemetry' });
        const nodesensor =  new bridgeFactory.BasePropertyBridge({ id: 'nodesensor2' }, { type: 'sensor' });

        node.addOption(nodeoption);
        node.addTelemetry(nodetelemetry);
        node.addSensor(nodesensor);
        node.removeOption(nodeoption.id);
        node.removeTelemetry(nodetelemetry.id);
        node.removeSensor(nodesensor.id);
        device.addOption(deviceoption);
        device.addTelemetry(devicetelemetry);
        device.addNode(node);
        device.removeOption(deviceoption.id);
        device.removeTelemetry(devicetelemetry.id);
        device.removeNode(node.id);
    });
    test('POSITIVE: BaseParser', async () => {
        const parser = new bridgeFactory.BaseParser();

        expect(parser.fromHomie('str')).toMatchObject([ 'str' ]);
        expect(parser.toHomie('str')).toBe('str');
        expect(parser.type).toBe('raw');
        expect(parser.homieDataType).toBe('string');

        // eslint-disable-next-line more/no-numeric-endings-for-variables
        const parser1 = new bridgeFactory.BaseParser('string');

        expect(parser1.type).toBe('string');
        expect(parser1.homieDataType).toBe('string');
    });

    test('POSITIVE: BasePropertyTransport', async () => {
        const transport = new bridgeFactory.BasePropertyTransport({
            data         : 'custom_data',
            pollInterval : 4000
        });

        transport.enablePolling();
        transport.enablePolling();
        transport.disablePolling();
        transport.disablePolling();

        expect(await transport.get()).toBe('custom_data');
        await transport.set('new_custom_data');
        expect(await transport.get()).toBe('new_custom_data');

        const erroredtransport = new bridgeFactory.ErroredTransport();
        const waserror = await new Promise((resolve) => {
            const func = (error) => {
                clearTimeout(timeout);
                erroredtransport.off('error', func);
                expect(error.message).toBe('Cannot get');
                resolve(true);
            };

            erroredtransport.on('error', func);
            const timeout = setTimeout(() => {
                clearTimeout(timeout);
                erroredtransport.off('error', func);
                resolve(false);
            }, 500);

            erroredtransport.enablePolling();
        });

        erroredtransport.disablePolling();

        expect(waserror).toBe(true);

        // should not poll if polling is not enabled
        const waspoll = await new Promise((resolve) => {
            const func = () => {
                clearTimeout(timeout);
                transport.off('afterPoll', func);
                resolve(true);
            };

            transport.on('afterPoll', func);
            const timeout = setTimeout(() => {
                clearTimeout(timeout);
                transport.off('afterPoll', func);
                resolve(false);
            }, 500);

            transport.poll();
        });

        expect(waspoll).toBe(false);

        // should not poll if pollInterval is null
        const transport2 = new bridgeFactory.BasePropertyTransport({
            data : 'custom_data'
        });
        const waspoll2 = await new Promise((resolve) => {
            const func = () => {
                clearTimeout(timeout);
                transport2.off('afterPoll', func);
                resolve(true);
            };

            transport2.on('afterPoll', func);
            const timeout = setTimeout(() => {
                clearTimeout(timeout);
                transport2.off('afterPoll', func);
                resolve(false);
            }, 500);

            transport2.enablePolling();
            transport2.poll();
        });

        transport2.disablePolling();

        expect(waspoll2).toBe(false);

        // should not poll if pollInterval is 0 and data is already loaded
        const transport3 = new bridgeFactory.BasePropertyTransport({
            data         : 'custom_data',
            pollInterval : 0
        });
        const waspoll3 = await new Promise((resolve) => {
            const func = () => {
                clearTimeout(timeout);
                transport3.off('afterPoll', func);
                resolve(true);
            };

            transport3.on('afterPoll', func);
            const timeout = setTimeout(() => {
                clearTimeout(timeout);
                transport3.off('afterPoll', func);
                resolve(false);
            }, 500);

            transport3.enablePolling();
            transport3.poll();
        });

        transport3.disablePolling();

        expect(waspoll3).toBe(true);

        // eslint-disable-next-line more/no-numeric-endings-for-variables
        const waserror2 = await new Promise((resolve) => {
            // eslint-disable-next-line camelcase
            const func = (error) => {
                clearTimeout(timeout);
                erroredtransport.off('error', func);
                expect(error.message).toBe('error custom');
                resolve(true);
            };

            erroredtransport.on('error', func);
            const timeout = setTimeout(() => {
                clearTimeout(timeout);
                erroredtransport.off('error', func);
                resolve(false);
            }, 500);

            erroredtransport.handleErrorPropagate(new Error('error custom'));
        });

        expect(waserror2).toBe(true);
    });

    test('POSITIVE: BaseDeviceBridge', async () => {
        const device = new bridgeFactory.BaseDeviceBridge({
            id         : 'deviceid',
            transports : [ new bridgeFactory.ErroredTransport({ id: 'errored' }) ]
        });

        expect(!!device.getPropertyTransportById('errored')).toBe(true);
        device.removePropertyTransport('errored');

        const waserror = await new Promise((resolve) => {
            // eslint-disable-next-line camelcase
            const func = (error) => {
                clearTimeout(timeout);
                device.off('error', func);
                expect(error.message).toBe('error custom');
                resolve(true);
            };

            device.on('error', func);
            const timeout = setTimeout(() => {
                clearTimeout(timeout);
                device.off('error', func);
                resolve(false);
            }, 500);

            device.handleErrorPropagate(new Error('error custom'));
        });

        expect(waserror).toBe(true);
    });

    test('POSITIVE: BaseNodeBridge', async () => {
        const node = new bridgeFactory.BaseNodeBridge({
            id         : 'nodeid',
            transports : [ new bridgeFactory.ErroredTransport({ id: 'errored' }) ]
        });

        expect(!!node.getPropertyTransportById('errored')).toBe(true);
        node.removePropertyTransport('errored');

        const waserror = await new Promise((resolve) => {
            // eslint-disable-next-line camelcase
            const func = (error) => {
                clearTimeout(timeout);
                node.off('error', func);
                expect(error.message).toBe('error custom');
                resolve(true);
            };

            node.on('error', func);
            const timeout = setTimeout(() => {
                clearTimeout(timeout);
                node.off('error', func);
                resolve(false);
            }, 500);

            node.handleErrorPropagate(new Error('error custom'));
        });

        expect(waserror).toBe(true);
    });

    test('POSITIVE: BasePropertyBridge', async () => {
        const device = new bridgeFactory.BaseDeviceBridge({
            id      : 'deviceid',
            options : [ new bridgeFactory.BasePropertyBridge({ id: 'deviceoptionid1' }, { type: 'option' }) ]
        });

        device.on('error', () => {});
        const option = device.options[0];

        const waserror = await new Promise((resolve) => {
            // eslint-disable-next-line camelcase
            const func = (error) => {
                clearTimeout(timeout);
                option.off('error', func);
                expect(error.message).toBe('error custom');
                resolve(true);
            };

            option.on('error', func);
            const timeout = setTimeout(() => {
                clearTimeout(timeout);
                option.off('error', func);
                resolve(false);
            }, 500);

            option.handleErrorPropagate(new Error('error custom'));
        });

        expect(waserror).toBe(true);

        option.detachTransport();

        expect(!!option.transport).toBe(false);
    });


    test('POSITIVE: create custom bridge', async () => {
        const value = Math.random().toString(36).substring(7);

        const device = new bridgeFactory.DeviceBridge({
            id        : 'deviceid',
            telemetry : [
                new bridgeFactory.PropertyBridge({
                    id : 'devicetelemetryid1',
                    value
                }, {
                    type : 'telemetry'
                })
            ],
            options : [
                new bridgeFactory.PropertyBridge({
                    id : 'deviceoptionid1',
                    value
                }, {
                    type : 'option'
                })
            ]
        });

        device.addTelemetry(
            new bridgeFactory.PropertyBridge({
                id    : 'devicetelemetryid2',
                value : 'value2'
            }, {
                type : 'telemetry'
            })
        );
        const node = new bridgeFactory.NodeBridge({
            id      : 'nodeid',
            options : [
                new bridgeFactory.PropertyBridge({ id: 'nodeoptionid' }, {
                    type      : 'option',
                    transport : new bridgeFactory.RandomNumberTransport({ id: 'transportid' }),
                    parser    : new bridgeFactory.MyParserMultiplier()
                })
            ],
            telemetry : [
                new bridgeFactory.PropertyBridge({ id: 'nodetelemetryid' }, {
                    type      : 'telemetry',
                    transport : new bridgeFactory.RandomNumberTransport({ id: 'transportid' }),
                    parser    : new bridgeFactory.MyParserMultiplier()
                })
            ],
            sensors : [
                new bridgeFactory.PropertyBridge({ id: 'nodesensorid' }, {
                    type      : 'sensor',
                    transport : new bridgeFactory.RandomNumberTransport({ id: 'transportid' }),
                    parser    : new bridgeFactory.MyParserMultiplier()
                })
            ]
        });

        device.addNode(node);
        const bridge = new bridgeFactory.Bridge({
            mqttConnection,
            connection : new bridgeFactory.CustomConnection(),
            device
        });

        bridge.init();
        bridge.on('error', (error) => {
            console.log(error);
            expect('error').toBe('no error');
        });
        // eslint-disable-next-line camelcase
        bridge.on('exit', () => {
            expect('exit').toBe('no exit');
        });
        bridge.connection.connect();
        await Promise.delay(500);
        expect(bridge.deviceBridge.telemetry[0].homieEntity.value).toBe(value);
        /** state doesn't change */
        expect(bridge.deviceBridge.homieEntity.state).toBe('ready');
        expect(bridge.deviceBridge.nodes[0].homieEntity.state).toBe('ready');
        bridge.connection.disconnect();
        await Promise.delay(500);
        /** state doesn't change */
        expect(bridge.deviceBridge.homieEntity.state).toBe('disconnected');
        expect(bridge.deviceBridge.nodes[0].homieEntity.state).toBe('disconnected');

        const wassynced = await new Promise((resolve) => {
            if (bridge.homie.synced) return resolve(true);

            const func = () => {
                clearTimeout(timeout);
                bridge.homie.off('synced', func);
                expect(bridge.homie.synced).toBe(true);
                resolve(true);
            };

            bridge.homie.on('synced', func);

            const timeout = setTimeout(() => {
                clearTimeout(timeout);
                bridge.homie.off('synced', func);
                resolve(false);
            }, 4000);
        });

        expect(wassynced).toBe(true);

        bridge.destroy();
        bridge.detachHomie();
        bridge.unsetDeviceBridge();
        await Promise.delay(500);
    });

    test('POSITIVE: catch errors from transport', async () => {
        const value = Math.random().toString(36).substring(7);

        const device = new bridgeFactory.DeviceBridge({
            id        : 'deviceid',
            telemetry : [
                new bridgeFactory.PropertyBridge({
                    id : 'devicetelemetryid1',
                    value
                }, {
                    type      : 'telemetry',
                    transport : new bridgeFactory.ErroredTransport({
                        data         : 'custom_data',
                        pollInterval : 2000
                    })
                })
            ]
        });

        const bridge = new bridgeFactory.Bridge({
            mqttConnection,
            connection : new bridgeFactory.CustomConnection(),
            device
        });

        // eslint-disable-next-line camelcase
        bridge.on('exit', () => {
            expect('exit').toBe('no exit');
        });
        const waserror = await new Promise((resolve) => {
            const func = (error) => {
                clearTimeout(timeout);
                bridge.off('error', func);
                expect(error.message).toBe('Cannot get');
                resolve(true);
            };

            bridge.on('error', func);
            const timeout = setTimeout(() => {
                clearTimeout(timeout);
                bridge.off('error', func);
                resolve(false);
            }, 500);

            bridge.init();
            bridge.deviceBridge.telemetry[0].transport.enablePolling();
        });

        bridge.deviceBridge.telemetry[0].transport.disablePolling();

        expect(waserror).toBe(true);
        const wassynced = await new Promise((resolve) => {
            if (bridge.homie.synced) return resolve(true);
            const func = () => {
                clearTimeout(timeout);
                bridge.homie.off('synced', func);
                expect(bridge.homie.synced).toBe(true);
                resolve(true);
            };

            bridge.homie.on('synced', func);
            const timeout = setTimeout(() => {
                clearTimeout(timeout);
                bridge.homie.off('synced', func);
                resolve(false);
            }, 4000);
        });

        expect(wassynced).toBe(true);
        bridge.destroy();
        bridge.detachHomie();
        bridge.unsetDeviceBridge();
    });

    test('POSITIVE: handle new device entities events', async () => {
        const device = new bridgeFactory.DeviceBridge({
            id : 'deviceid'
        });

        const bridge = new bridgeFactory.Bridge({
            mqttConnection,
            connection : new bridgeFactory.CustomConnection(),
            device
        });

        // eslint-disable-next-line camelcase
        bridge.on('exit', () => {
            expect('exit').toBe('no exit');
        });

        bridge.init();
        const wassynced = await new Promise((resolve) => {
            if (bridge.homie.synced) return resolve(true);
            const func = () => {
                clearTimeout(timeout);
                bridge.homie.off('synced', func);
                expect(bridge.homie.synced).toBe(true);
                resolve(true);
            };

            bridge.homie.on('synced', func);
            const timeout = setTimeout(() => {
                clearTimeout(timeout);
                bridge.homie.off('synced', func);
                resolve(false);
            }, 4000);
        });

        expect(wassynced).toBe(true);

        expect(bridge.deviceBridge.telemetry.length).toBe(2);
        expect(bridge.deviceBridge.options.length).toBe(1);
        expect(bridge.deviceBridge.nodes.length).toBe(1);


        bridge.destroy();
        bridge.detachHomie();
        bridge.unsetDeviceBridge();
    });

    test('POSITIVE: handle new node entities events', async () => {
        const device = new bridgeFactory.DeviceBridge({
            id    : 'deviceid',
            nodes : [
                new bridgeFactory.NodeBridge({
                    id : 'nodeid'
                })
            ]
        });

        const bridge = new bridgeFactory.Bridge({
            mqttConnection,
            connection : new bridgeFactory.CustomConnection(),
            device
        });

        // eslint-disable-next-line camelcase
        bridge.on('exit', () => {
            expect('exit').toBe('no exit');
        });

        bridge.init();
        const wassynced = await new Promise((resolve) => {
            if (bridge.homie.synced) return resolve(true);
            const func = () => {
                clearTimeout(timeout);
                bridge.homie.off('synced', func);
                expect(bridge.homie.synced).toBe(true);
                resolve(true);
            };

            bridge.homie.on('synced', func);
            const timeout = setTimeout(() => {
                clearTimeout(timeout);
                bridge.homie.off('synced', func);
                resolve(false);
            }, 4000);
        });

        expect(wassynced).toBe(true);

        expect(bridge.deviceBridge.nodes[0].telemetry.length).toBe(1);
        expect(bridge.deviceBridge.nodes[0].options.length).toBe(1);
        expect(bridge.deviceBridge.nodes[0].sensors.length).toBe(1);


        bridge.destroy();
        bridge.detachHomie();
        bridge.unsetDeviceBridge();
    });

    test('POSITIVE: handle set event', async () => {
        const device = new bridgeFactory.DeviceBridge({
            id        : 'deviceid',
            telemetry : [ new bridgeFactory.BasePropertyBridge({ id: 'devicetelemetryid1', settable: true, value: 'value' }, { type: 'telemetry' }) ]
        });

        const bridge = new bridgeFactory.Bridge({
            mqttConnection,
            connection : new bridgeFactory.CustomConnection(),
            device
        });

        // eslint-disable-next-line camelcase
        bridge.on('exit', () => {
            expect('exit').toBe('no exit');
        });

        bridge.init();
        const wassynced = await new Promise((resolve) => {
            if (bridge.homie.synced) return resolve(true);
            const func = () => {
                clearTimeout(timeout);
                bridge.homie.off('synced', func);
                expect(bridge.homie.synced).toBe(true);
                resolve(true);
            };

            bridge.homie.on('synced', func);
            const timeout = setTimeout(() => {
                clearTimeout(timeout);
                bridge.homie.off('synced', func);
                resolve(false);
            }, 4000);
        });

        expect(wassynced).toBe(true);

        homie.getDeviceById('deviceid').getTelemetryById('devicetelemetryid1').setAttribute('value', 'another_value');
        await Promise.delay(2000);

        expect(device.telemetry[0].value()).toBe('another_value');

        bridge.destroy();
        bridge.detachHomie();
        bridge.unsetDeviceBridge();
    });

    test('POSITIVE: handle set error event', async () => {
        const device = new bridgeFactory.DeviceBridge({
            id        : 'deviceid',
            telemetry : [ new bridgeFactory.BasePropertyBridge({ id: 'devicetelemetryid1', settable: true, value: 'value' }, {
                type      : 'telemetry',
                transport : new bridgeFactory.ErroredTransport()
            }) ]
        });

        const bridge = new bridgeFactory.Bridge({
            mqttConnection,
            connection : new bridgeFactory.CustomConnection(),
            device
        });

        // eslint-disable-next-line camelcase
        bridge.on('exit', () => {
            expect('exit').toBe('no exit');
        });

        bridge.init();
        const wassynced = await new Promise((resolve) => {
            if (bridge.homie.synced) return resolve(true);
            const func = () => {
                clearTimeout(timeout);
                bridge.homie.off('synced', func);
                expect(bridge.homie.synced).toBe(true);
                resolve(true);
            };

            bridge.homie.on('synced', func);
            const timeout = setTimeout(() => {
                clearTimeout(timeout);
                bridge.homie.off('synced', func);
                resolve(false);
            }, 4000);
        });

        expect(wassynced).toBe(true);

        const waserror = await new Promise((resolve) => {
            if (bridge.homie.synced) return resolve(true);
            const eventname = 'homie.error.deviceid.telemetry.devicetelemetryid1';
            const func = () => {
                clearTimeout(timeout);
                bridge.homie.off(eventname, func);
                resolve(true);
            };

            bridge.homie.on(eventname, func);
            const timeout = setTimeout(() => {
                clearTimeout(timeout);
                bridge.homie.off(eventname, func);
                resolve(false);
            }, 4000);

            homie.getDeviceById('deviceid').getTelemetryById('devicetelemetryid1').setAttribute('value', 'another_value');
        });

        expect(waserror).toBe(true);

        bridge.destroy();
        bridge.detachHomie();
        bridge.unsetDeviceBridge();
    });

    test('POSITIVE: handle delete node event', async () => {
        const value = Math.random().toString(36).substring(7);
        const device = new bridgeFactory.DeviceBridge({
            id        : 'deviceid',
            telemetry : [
                new bridgeFactory.PropertyBridge({
                    id : 'devicetelemetryid1',
                    value
                }, {
                    type : 'telemetry'
                })
            ],
            options : [
                new bridgeFactory.PropertyBridge({
                    id : 'deviceoptionid1',
                    value
                }, {
                    type : 'option'
                })
            ]
        });

        device.addTelemetry(
            new bridgeFactory.PropertyBridge({
                id    : 'devicetelemetryid2',
                value : 'value2'
            }, {
                type : 'telemetry'
            })
        );
        const node = new bridgeFactory.NodeBridge({
            id      : 'nodeid',
            options : [
                new bridgeFactory.PropertyBridge({ id: 'nodeoptionid' }, {
                    type      : 'option',
                    transport : new bridgeFactory.RandomNumberTransport({ id: 'transportid' }),
                    parser    : new bridgeFactory.MyParserMultiplier()
                })
            ],
            telemetry : [
                new bridgeFactory.PropertyBridge({ id: 'nodetelemetryid' }, {
                    type      : 'telemetry',
                    transport : new bridgeFactory.RandomNumberTransport({ id: 'transportid' }),
                    parser    : new bridgeFactory.MyParserMultiplier()
                })
            ],
            sensors : [
                new bridgeFactory.PropertyBridge({ id: 'nodesensorid' }, {
                    type      : 'sensor',
                    transport : new bridgeFactory.RandomNumberTransport({ id: 'transportid' }),
                    parser    : new bridgeFactory.MyParserMultiplier()
                })
            ]
        });

        device.addNode(node);

        const bridge = new bridgeFactory.Bridge({
            mqttConnection,
            connection : new bridgeFactory.CustomConnection(),
            device
        });

        // eslint-disable-next-line camelcase
        bridge.on('exit', () => {
            expect('exit').toBe('no exit');
        });

        bridge.init();
        const wassynced = await new Promise((resolve) => {
            if (bridge.homie.synced) return resolve(true);
            const func = () => {
                clearTimeout(timeout);
                bridge.homie.off('synced', func);
                expect(bridge.homie.synced).toBe(true);
                resolve(true);
            };

            bridge.homie.on('synced', func);
            const timeout = setTimeout(() => {
                clearTimeout(timeout);
                bridge.homie.off('synced', func);
                resolve(false);
            }, 4000);
        });

        expect(wassynced).toBe(true);

        const homieMigrator = new HomieMigrator({ homie });

        homieMigrator.deleteNode(homie.getDeviceById('deviceid').getNodeById('nodeid'));

        await Promise.delay(3000);
        expect(bridge.deviceBridge.nodes[0].deleted).toBe(true);

        bridge.destroy();
        bridge.detachHomie();
        bridge.unsetDeviceBridge();
    });

    test('POSITIVE: handle delete device event', async () => {
        const device = new bridgeFactory.DeviceBridge({
            id : 'deviceid'
        });

        const bridge = new bridgeFactory.Bridge({
            mqttConnection,
            connection : new bridgeFactory.CustomConnection(),
            device
        });

        bridge.on('error', (error) => {
            console.log(error);
        });

        bridge.init();
        const wassynced = await new Promise((resolve) => {
            if (bridge.homie.synced) return resolve(true);
            const func = () => {
                clearTimeout(timeout);
                bridge.homie.off('synced', func);
                expect(bridge.homie.synced).toBe(true);
                resolve(true);
            };

            bridge.homie.on('synced', func);
            const timeout = setTimeout(() => {
                clearTimeout(timeout);
                bridge.homie.off('synced', func);
                resolve(false);
            }, 4000);
        });

        expect(wassynced).toBe(true);

        const homieMigrator = new HomieMigrator({ homie });
        const homieDevice = homie.getDeviceById('deviceid');

        homieDevice.onAttach(homie);

        homieMigrator.deleteDevice(homieDevice);

        await Promise.delay(3000);
        expect(bridge.deviceBridge.deleted).toBe(true);

        bridge.destroy();
        bridge.detachHomie();
        bridge.unsetDeviceBridge();
    });

    test('POSITIVE: bridges manager init successfully', async () => {
        const firmwareName = 'test_firmware';
        const bridgesManager = new bridgeFactory.BridgesManager({
            firmwareName,
            mqttConnectionOpts : mqttConnection
        });

        await bridgesManager.init();

        expect(bridgesManager.transport.listeners('message').length).toBe(1);
        expect(bridgesManager.transport.listeners('error').length).toBe(1);
    });

    test('POSITIVE: bridges manager _handleMessage', async () => {
        const firmwareName = 'test_firmware';
        const bridgesManager = new bridgeFactory.BridgesManager({
            firmwareName,
            mqttConnectionOpts : mqttConnection
        });

        await bridgesManager.init();

        await expect(bridgesManager._handleMessage('fake-topic', 'message')).resolves.toBeUndefined();
    });

    test('POSITIVE: bridges manager _handleError', async () => {
        const firmwareName = 'test_firmware';
        const bridgesManager = new bridgeFactory.BridgesManager({
            firmwareName,
            mqttConnectionOpts : mqttConnection
        });

        await bridgesManager.init();

        await expect(bridgesManager._handleMessage('ERROR')).resolves.toBeUndefined();
    });

    test('POSITIVE: bridges manager returns correct root topic', async () => {
        const firmwareName = 'test_firmware';
        const bridgesManager = new bridgeFactory.BridgesManager({
            firmwareName,
            mqttConnectionOpts : mqttConnection
        });

        const expectedRootTopic = `fw_base/${firmwareName}`;

        expect(bridgesManager.getRootTopic()).toBe(expectedRootTopic);
    });
});
