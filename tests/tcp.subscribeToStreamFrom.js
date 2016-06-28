var globalHooks = require('./_globalHooks');

var tcpConfig = require('./support/tcpConfig');
var assert = require('assert');
var eventstore = require('../index.js');
var uuid = require('node-uuid');

describe('TCP Client - SubscribeToStreamFrom', function() {
    it('Should get all events written to a subscription stream', function(done) {

        this.timeout(9 * 1000);
        var client = eventstore.tcp(tcpConfig);

        var testStream = 'TestStream-' + uuid.v4();

        var proccessedEventCount = 0;

        function onEventAppeared(ev) {
            proccessedEventCount++;
            return;
        };

        function onLiveProcessingStarted() {
            return;
        }

        function onDropped(reason) {
            done('should not drop');
        };



        var events = [];
        for (var k = 0; k < 10; k++) {
            events.push(eventstore.eventFactory.NewEvent('TestEventType', {
                id: k
            }));
        }
        
        return client.writeEvents(testStream, events).then(function() {
            return client.subscribeToStreamFrom(testStream, 0, onEventAppeared, onLiveProcessingStarted, onDropped).then(function(connection) {
                setTimeout(function() {

                    assert.equal(10, proccessedEventCount);
                    assert(connection,'Connection Expected');
                    connection.close();
                    done();
                }, 3000);
            });
        });


    });
});