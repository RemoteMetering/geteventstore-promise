require('./_globalHooks');

const tcpConfig = require('./support/tcpConfig');
const eventstore = require('../index.js');
const assert = require('assert');
const uuid = require('uuid');

describe('TCP Client - Write Events', () => {
    it('Write to a new stream and read the events', () => {
        const client = eventstore.tcp(tcpConfig);

        const events = [eventstore.eventFactory.NewEvent('TestEventType', {
            something: '456'
        })];

        const testStream = `TestStream-${uuid.v4()}`;
        return client.writeEvents(testStream, events).then(() => client.getEvents(testStream).then(events => {
            assert.equal(events[0].data.something, '456');
        }));
    });

    it('Write to a new stream and read the events by type', () => {
        const client = eventstore.tcp(tcpConfig);

        const events = [eventstore.eventFactory.NewEvent('TestEventType', {
            something: '456'
        }), eventstore.eventFactory.NewEvent('ToBeIgnoredType', {
            something: '789'
        })];

        const testStream = `TestStream-${uuid.v4()}`;
        return client.writeEvents(testStream, events).then(() => client.getEventsByType(testStream, ['TestEventType']).then(events => {
            assert.equal(events.length, 1);
            assert.equal(events[0].eventType, 'TestEventType');
            assert.equal(events[0].data.something, '456');
        }));
    });

     it('Should not fail promise if no events provided', () => {
        const client = eventstore.tcp(tcpConfig);

        const events =[];

        const testStream = `TestStream-${uuid.v4()}`;
        return client.writeEvents(testStream, events);
    });

     it('Should fail promise if non array provided', () => {
        const client = eventstore.tcp(tcpConfig);

        const events = {
            something: 'here'
        };

        const testStream = `TestStream-${uuid.v4()}`;
        return client.writeEvents(testStream, events).then(() => {
            assert.fail('should not have succeeded');
        }).catch(err => {
            assert(err, 'error expected');
        });
    });
});