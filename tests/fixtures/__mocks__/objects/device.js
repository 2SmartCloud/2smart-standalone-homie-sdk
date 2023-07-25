module.exports = {
    'id'              : 'device-id',
    'name'            : 'test device',
    'state'           : 'init',
    'implementation'  : 'implementation',
    'mac'             : 'ab:cd:ef:gh:ij',
    'localIp'         : '127.0.0.1',
    'firmwareName'    : '1.2-rc',
    'firmwareVersion' : 'V1',
    'telemetry'       : [
        {
            'id'       : 'battery',
            'unit'     : '%',
            'dataType' : 'integer',
            'retained' : 'true',
            'settable' : 'false',
            'name'     : 'Battery lvl',
            'value'    : '90'
        }
    ],
    'options' : [
        {
            'id'       : 'location',
            'unit'     : '#',
            'dataType' : 'enum',
            'retained' : 'true',
            'settable' : 'true',
            'format'   : 'Kyiv,London,Sydney',
            'name'     : 'Location',
            'value'    : 'Kyiv'
        }
    ],
    'nodes' : [
        {
            'id'      : 'thermometer',
            'sensors' : [
                {
                    'id'       : 'temperature-sensor',
                    'unit'     : '°C',
                    'dataType' : 'float',
                    'retained' : 'true',
                    'settable' : 'false',
                    'name'     : 'Current temperature',
                    'value'    : '26'
                }
            ],
            'telemetry' : [
                {
                    'id'       : 'battery',
                    'unit'     : '%',
                    'dataType' : 'integer',
                    'retained' : 'true',
                    'settable' : 'false',
                    'name'     : 'Battery lvl',
                    'value'    : '90'
                }
            ],
            'options' : [
                {
                    'id'       : 'location',
                    'unit'     : '#',
                    'dataType' : 'enum',
                    'retained' : 'true',
                    'settable' : 'true',
                    'format'   : 'Kyiv,London,Sydney',
                    'name'     : 'Location',
                    'value'    : 'Kyiv'
                }
            ],
            'state' : 'init',
            'type'  : 'V1',
            'name'  : 'Thermometer'
        }
    ]
};
