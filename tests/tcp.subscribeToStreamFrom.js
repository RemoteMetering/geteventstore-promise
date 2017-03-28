require('./_globalHooks');

var tcpConfig = require('./support/tcpConfig');
var eventstore = require('../index.js');
var Promise = require('bluebird');
var assert = require('assert');
var uuid = require('uuid');

describe('TCP Client - Subscribe To Stream', () => {
    it('Should get all events written to a subscription stream', function(done) {
        this.timeout(9 * 1000);
        var client = eventstore.tcp(tcpConfig);
        var testStream = `TestStream-${uuid.v4()}`;
        var processedEventCount = 0;

        function onEventAppeared() {
            processedEventCount++;
        }

        function onDropped() {
            done('should not drop');
        }

        var events = [];
        for (var k = 0; k < 10; k++) {
            events.push(eventstore.eventFactory.NewEvent('TestEventType', {
                id: k
            }));
        }

        return client.writeEvents(testStream, events).then(() => client.subscribeToStreamFrom(testStream, 0, onEventAppeared, undefined, onDropped).then(connection => Promise.delay(3000).then(() => {
            assert.equal(10, processedEventCount);
            assert(connection, 'Connection Expected');
            connection.close();
            done();
        })));
    });

    it('Should get all resolved events read from a linked stream', function(done) {
        this.timeout(9 * 1000);

        var client = eventstore.tcp(tcpConfig);
        var testStream = `TestStream-${uuid.v4()}`;
        var connection;
        var doDone = true;

        function onEventAppeared(ev) {
            assert(ev.link, 'link object expected');
            if (doDone) {
                connection.close();
                done();
            }
            doDone = false;
        }

        function onDropped() {
            done('should not drop during test');
        }

        var events = [];
        for (var k = 0; k < 10; k++) {
            events.push(eventstore.eventFactory.NewEvent('TestEventType', {
                id: k
            }));
        }

        return client.writeEvents(testStream, events).then(() => {
            var settings = {
                resolveLinkTos: true
            };
            return client.subscribeToStreamFrom('$ce-TestStream', 5, onEventAppeared, undefined, onDropped, settings).then(subscriptionConnection => {
                connection = subscriptionConnection;
            });
        });
    });
});