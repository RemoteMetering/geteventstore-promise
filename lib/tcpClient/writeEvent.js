const debug = require('debug')('geteventstore:writeEvent');
const connectionManager = require('./connectionManager');
const client = require('node-eventstore-client');
const Promise = require('bluebird');
const assert = require('assert');
const uuid = require('uuid');
const _ = require('lodash');

const baseErr = 'Write Event - ';

module.exports = config => (streamName, eventType, data, metaData, options) => Promise.resolve().then(() => {
    assert(streamName, `${baseErr}Stream Name not provided`);
    assert(eventType, `${baseErr}Event Type not provided`);
    assert(data, `${baseErr}Event Data not provided`);

    options = options || {};
    options.expectedVersion = options.expectedVersion || -2;

    const event = client.createJsonEventData(uuid.v4(), data, metaData, eventType);

    return connectionManager.create(config).then(connection => connection.appendToStream(streamName, options.expectedVersion, [event], config.credentials).then(result => {
        debug('', 'Result: %j', result);
        if (!_.isEmpty(result.error))
            throw new Error(result.error);

        return result;
    }));
});