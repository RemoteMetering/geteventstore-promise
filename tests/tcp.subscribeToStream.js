var globalHooks = require('./_globalHooks');

var tcpConfig = require('./support/tcpConfig');
var eventstore = require('../index.js');
var Promise = require('bluebird');
var assert = require('assert');
var uuid = require('uuid');

describe('TCP Client - Subscribe To Stream', function() {
    it('Should get all events written to a subscription stream after subscription is started', function(done) {
        this.timeout(9 * 1000);
        var client = eventstore.tcp(tcpConfig);
        var testStream = 'TestStream-' + uuid.v4();
        var processedEventCount = 0;
        var confirmCalled = false;

        function onEventAppeared(ev) {
            processedEventCount++;
        };

        function onConfirmed() {
            confirmCalled = true;
        };

        function onDropped(reason) {
            done('should not drop');
        }

        var initialEvents = [];

        for (var k = 0; k < 10; k++) {
            initialEvents.push(eventstore.eventFactory.NewEvent('TestEventType', {
                id: k
            }));
        }

        return client.writeEvents(testStream, initialEvents).then(function() {
            client.subscribeToStream(testStream, onEventAppeared, onConfirmed, onDropped, false).then(function(connection) {
                return Promise.delay(3000).then(function() {
                    assert.equal(true, confirmCalled, 'expected confirmed subscription to be called');
                    assert.equal(10, processedEventCount, 'expect proccessed eventst to be 10');
                    assert(connection, 'Connection Expected');
                    connection.close();
                    done();
                });
            });
            events = [];
            for (var k = 0; k < 10; k++) {
                events.push(eventstore.eventFactory.NewEvent('TestEventType', {
                    id: k
                }));
            }
            return Promise.delay(100).then(function() {
                return client.writeEvents(testStream, events);
            });
        });
    });
});