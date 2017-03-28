require('./_globalHooks');

var tcpConfig = require('./support/tcpConfig');
var eventstore = require('../index.js');
var assert = require('assert');
var uuid = require('uuid');

describe('TCP Client - Write Event', () => {
    it('Write to a new stream and read the event', () => {
        var client = eventstore.tcp(tcpConfig);

        var testStream = `TestStream-${uuid.v4()}`;
        return client.writeEvent(testStream, 'TestEventType', {
            something: '123'
        }).then(() => client.getEvents(testStream).then(events => {
            assert.equal(events[0].data.something, '123');
        }));
    });

    it('Should fail promise if no event data provided', () => {
        var client = eventstore.tcp(tcpConfig);

        var testStream = `TestStream-${uuid.v4()}`;
        return client.writeEvent(testStream, 'TestEventType'
            ).then(() => {
            assert.fail('write should not have succeeded');
        }).catch(err => {
            assert(err,'error should have been returned');
        });
    });
});