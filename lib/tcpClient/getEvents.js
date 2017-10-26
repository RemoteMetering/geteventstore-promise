import connectionManager from './connectionManager';
import mapEvents from './utilities/mapEvents';
import debugModule from 'debug';
import Promise from 'bluebird';
import assert from 'assert';
import _ from 'lodash';

const debug = debugModule('geteventstore:getevents');
const baseErr = 'Get Events - ';

module.exports = config => (streamName, startPosition, length, direction, resolveLinkTos) => Promise.resolve().then(() => {
    assert(streamName, `${baseErr}Stream Name not provided`);

    direction = direction || 'forward';
    startPosition = startPosition === undefined && direction === 'backward' ? -1 : startPosition || 0;
    length = length || 1000;
    resolveLinkTos = resolveLinkTos === undefined ? true : resolveLinkTos;

    if (length > 4096) {
        console.warn('WARNING: Max event return limit exceeded. Using the max of 4096');
        length = 4096;
    }

    return connectionManager.create(config).then(connection => {
        function handleResult(result) {
            debug('', 'Result: %j', result);
            if (!_.isEmpty(result.error)) throw new Error(result.error);
            return mapEvents(result.events);
        }

        if (direction === 'forward')
            return connection.readStreamEventsForward(streamName, startPosition, length, resolveLinkTos, config.credentials).then(handleResult);
        else
            return connection.readStreamEventsBackward(streamName, startPosition, length, resolveLinkTos, config.credentials).then(handleResult);
    });
});