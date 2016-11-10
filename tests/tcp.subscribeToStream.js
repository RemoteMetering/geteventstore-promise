var globalHooks = require('./_globalHooks');

var tcpConfig = require('./support/tcpConfig');
var eventstore = require('../index.js');
var uuid = require('node-uuid');
var assert = require('assert');
var q = require('q');

describe('TCP Client - Subscribe To Stream', function() {
    it('Should get all events written to a subscription stream after subscription is started', function(done) {
        this.timeout(9 * 1000);
        var client = eventstore.tcp(tcpConfig);

        var testStream = 'TestStream-' + uuid.v4();

        var proccessedEventCount = 0;

        var confirmCalled = false;

        function onEventAppeared(ev) {
            proccessedEventCount++;
            return;
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
                return q.delay(3000).then(function() {

                    console.log('events Written');
                    assert.equal(true, confirmCalled, 'expected confirmed subscription to be called');
                    assert.equal(10, proccessedEventCount, 'expect proccessed eventst to be 10');
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
            return q.delay(100).then(function() {
                return client.writeEvents(testStream, events);
            });
        });
    });
});