module.exports = {
    scenario : {
        'scenarios/scenario3/$state'             : 'false',
        'scenarios/scenario3/$thresholds'        : 'setpoint',
        'scenarios/scenario3/setpoint'           : 'false',
        'scenarios/scenario3/setpoint/$name'     : 'name',
        'scenarios/scenario3/setpoint/$settable' : 'true',
        'scenarios/scenario3/setpoint/$retained' : 'true',
        'scenarios/scenario3/setpoint/$datatype' : 'boolean',
        'scenarios/scenario3/setpoint/$unit'     : '#',
        'scenarios/scenario3/setpoint/$format'   : ''
    },
    threshold : {
        'scenarios/scenario3/$state'           : 'false',
        'scenarios/scenario3/$thresholds'      : 'test-1',
        'scenarios/scenario3/test-1'           : 'false',
        'scenarios/scenario3/test-1/$name'     : 'name',
        'scenarios/scenario3/test-1/$settable' : 'true',
        'scenarios/scenario3/test-1/$retained' : 'true',
        'scenarios/scenario3/test-1/$datatype' : 'boolean',
        'scenarios/scenario3/test-1/$unit'     : '#',
        'scenarios/scenario3/test-1/$format'   : ''
    }
};
