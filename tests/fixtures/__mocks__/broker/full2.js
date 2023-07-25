module.exports = {
    device : {
        'sweet-home/dynamic-device/$homie'          : '3.1.1',
        'sweet-home/dynamic-device/$name'           : 'Example of status, signal and battery displaying',
        'sweet-home/dynamic-device/$localip'        : '112',
        'sweet-home/dynamic-device/$mac'            : '2312',
        'sweet-home/dynamic-device/$fw/name'        : 'asdad',
        'sweet-home/dynamic-device/$fw/version'     : '1231231',
        'sweet-home/dynamic-device/$implementation' : 'dafs',
        'sweet-home/dynamic-device/$state'          : 'ready'
    },
    node : {
        'sweet-home/dynamic-device/$nodes'          : 'controls',
        'sweet-home/dynamic-device/controls/$name'  : 'Controls',
        'sweet-home/dynamic-device/controls/$type'  : 'v1',
        'sweet-home/dynamic-device/controls/$state' : 'init'
    },
    sensor : {
        'sweet-home/dynamic-device/controls/$properties'      : 'sensor',
        'sweet-home/dynamic-device/controls/sensor'           : '10',
        'sweet-home/dynamic-device/controls/sensor/$name'     : 'Editable integer',
        'sweet-home/dynamic-device/controls/sensor/$settable' : 'true',
        'sweet-home/dynamic-device/controls/sensor/$retained' : 'true',
        'sweet-home/dynamic-device/controls/sensor/$datatype' : 'integer',
        'sweet-home/dynamic-device/controls/sensor/$unit'     : '%',
        'sweet-home/dynamic-device/controls/sensor/$format'   : ''
    },
    nodeTelemetry : {
        'sweet-home/dynamic-device/controls/$telemetry'                  : 'signal',
        'sweet-home/dynamic-device/controls/$telemetry/signal'           : '81',
        'sweet-home/dynamic-device/controls/$telemetry/signal/$name'     : 'Signal lvl',
        'sweet-home/dynamic-device/controls/$telemetry/signal/$unit'     : '%',
        'sweet-home/dynamic-device/controls/$telemetry/signal/$datatype' : 'integer',
        'sweet-home/dynamic-device/controls/$telemetry/signal/$settable' : 'true'
    },
    nodeOption : {
        'sweet-home/dynamic-device/controls/$options'                  : 'signal',
        'sweet-home/dynamic-device/controls/$options/signal'           : '81',
        'sweet-home/dynamic-device/controls/$options/signal/$name'     : 'Signal lvl',
        'sweet-home/dynamic-device/controls/$options/signal/$unit'     : '%',
        'sweet-home/dynamic-device/controls/$options/signal/$datatype' : 'integer',
        'sweet-home/dynamic-device/controls/$options/signal/$settable' : 'true'
    },
    deviceTelemetry : {
        'sweet-home/dynamic-device/$telemetry'                  : 'signal',
        'sweet-home/dynamic-device/$telemetry/signal'           : '81',
        'sweet-home/dynamic-device/$telemetry/signal/$name'     : 'Signal lvl',
        'sweet-home/dynamic-device/$telemetry/signal/$unit'     : '%',
        'sweet-home/dynamic-device/$telemetry/signal/$datatype' : 'integer',
        'sweet-home/dynamic-device/$telemetry/signal/$settable' : 'true'
    },
    deviceOption : {
        'sweet-home/dynamic-device/$options'                  : 'signal',
        'sweet-home/dynamic-device/$options/signal'           : '81',
        'sweet-home/dynamic-device/$options/signal/$name'     : 'Signal lvl',
        'sweet-home/dynamic-device/$options/signal/$unit'     : '%',
        'sweet-home/dynamic-device/$options/signal/$datatype' : 'integer',
        'sweet-home/dynamic-device/$options/signal/$settable' : 'true'
    }
};
