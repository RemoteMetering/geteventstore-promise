module.exports = function(config) {
    return {
        write: require('./write')(config),
        getEvents: require('./getEvents')(config),
        getProjectionState: require('./getProjectionState')(config)
    }
}