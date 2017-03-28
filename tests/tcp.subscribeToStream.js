require('./_globalHooks');

const tcpConfig = require('./support/tcpConfig');
const eventstore = require('../index.js');
const Promise = require('bluebird');
const assert = require('assert');
const uuid = require('uuid');

describe('TCP Client - Subscribe To Stream', () => {
    it('Should get all events written to a subscription stream after subscription is started', function(done) {
        this.timeout(9 * 1000);
        const client = eventstore.tcp(tcpConfig);
        const testStream = `TestStream-${uuid.v4()}`;
        let processedEventCount = 0;
        let confirmCalled = false;

        function onEventAppeared() {
            processedEventCount++;
        }

        function onConfirmed() {
            confirmCalled = true;
        }

        function onDropped() {
            done('should not drop');
        }

        const initialEvents = [];

        for (let k = 0; k < 10; k++) {
            initialEvents.push(eventstore.eventFactory.NewEvent('TestEventType', {
                id: k
            }));
        }

        client.writeEvents(testStream, initialEvents).then(() => {
            client.subscribeToStream(testStream, onEventAppeared, onConfirmed, onDropped, false).then(connection => Promise.delay(3000).then(() => {
                assert.equal(true, confirmCalled, 'expected confirmed subscription to be called');
                assert.equal(10, processedEventCount, 'expect proccessed eventst to be 10');
                assert(connection, 'Connection Expected');
                connection.close();
                done();
            }));
            const events = [];
            for (let k = 0; k < 10; k++) {
                events.push(eventstore.eventFactory.NewEvent('TestEventType', {
                    id: k
                }));
            }
            return Promise.delay(100).then(() => client.writeEvents(testStream, events));
        }).catch(done);
    });
});