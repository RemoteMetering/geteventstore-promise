require('./_globalHooks');

var httpConfig = require('./support/httpConfig');
var eventstore = require('../index.js');
var assert = require('assert');
var uuid = require('uuid');

describe('Http Client - Write Events', function() {
    it('Write to a new stream and read the events', function() {
        var client = eventstore.http(httpConfig);

        var events = [eventstore.eventFactory.NewEvent('TestEventType', {
            something: '456'
        })];

        var testStream = `TestStream-${uuid.v4()}`;
        return client.writeEvents(testStream, events).then(function() {
            return client.getEvents(testStream).then(function(events) {
                assert.equal(events[0].data.something, '456');
            });
        });
    });

    it('Should not fail promise if no events provided', function() {
        var client = eventstore.http(httpConfig);

        var events = [];

        var testStream = `TestStream-${uuid.v4()}`;
        return client.writeEvents(testStream, events);
    });

    it('Should fail promise if non array provided', function() {
        var client = eventstore.http(httpConfig);

        var events = {
            something: 'here'
        };

        var testStream = `TestStream-${uuid.v4()}`;
        return client.writeEvents(testStream, events).then(function() {
            assert.fail('should not have succeeded');
        }).catch(function(err) {
            assert(err, 'error expected');
        });
    });
});