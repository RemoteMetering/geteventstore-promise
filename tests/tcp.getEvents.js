require('./_globalHooks');

var tcpConfig = require('./support/tcpConfig');
var eventstore = require('../index.js');
var assert = require('assert');
var uuid = require('uuid');

describe('TCP Client - Get Events', () => {
    var testStream = `TestStream-${uuid.v4()}`;
    var numberOfEvents = 10;

    before(() => {
        var client = eventstore.tcp(tcpConfig);

        var events = [];

        for (var i = 1; i <= numberOfEvents; i++) {
            events.push(eventstore.eventFactory.NewEvent('TestEventType', {
                something: i
            }));
        }

        return client.writeEvents(testStream, events);
    });

    it('Should get events reading forward', () => {
        var client = eventstore.tcp(tcpConfig);

        return client.getEvents(testStream, undefined, undefined, 'forward').then(events => {
            assert.equal(events.length, 10);
            assert.equal(events[0].data.something, 1);
            assert.equal('TestEventType', events[0].eventType);
            assert(events[0].created);
            assert(events[0].metadata);
            assert(events[0].isJson !== undefined);
        });
    });

    it('Should get events reading backward', () => {
        var client = eventstore.tcp(tcpConfig);

        return client.getEvents(testStream, undefined, undefined, 'backward').then(events => {
            assert.equal(events.length, 10);
            assert.equal(events[0].data.something, 10);
        });
    });

    it('Should get last event reading backward with larger size than events', () => {
        var client = eventstore.tcp(tcpConfig);

        return client.getEvents(testStream, 0, 250, 'backward').then(events => {
            assert.equal(events.length, 1);
            assert.equal(events[0].data.something, 1);
        });
    });

    it('Should not get any events when start event is greater than the stream length', () => {
        var client = eventstore.tcp(tcpConfig);

        return client.getEvents(testStream, 11).then(events => {
            assert.equal(events.length, 0);
        });
    });

    it('Should get events reading backward from a start position', () => {
        var client = eventstore.tcp(tcpConfig);

        return client.getEvents(testStream, 2, undefined, 'backward').then(events => {
            assert.equal(events.length, 3);
            assert.equal(events[0].data.something, 3);
        });
    });

    it('Should get events reading backward with a length greater than the stream length', () => {
        var client = eventstore.tcp(tcpConfig);

        return client.getEvents(testStream, undefined, 10000, 'backward').then(events => {
            assert.equal(events.length, 10);
            assert.equal(events[0].data.something, 10);
        });
    });

    it('Should get events reading forward with a length greater than the stream length return a maximum of 4096', function() {
        this.timeout(40000);
        var client = eventstore.tcp(tcpConfig);

        var testStream = `TestStream-${uuid.v4()}`;
        var numberOfEvents = 5000;
        var events = [];

        for (var i = 1; i <= numberOfEvents; i++) {
            events.push(eventstore.eventFactory.NewEvent('TestEventType', {
                something: i
            }));
        }

        return client.writeEvents(testStream, events).then(() => client.getEvents(testStream, undefined, 5000).then(events => {
            assert.equal(events.length, 4096);
            assert.equal(events[0].data.something, 1);
            assert.equal(events[4095].data.something, 4096);
        }));
    });

    it('Should get linked to events and map correctly', () => {
        var client = eventstore.tcp(tcpConfig);

        return client.getEvents('$ce-TestStream', 0, 1, 'forward').then(events => {
            assert.equal(events.length, 1);
            assert(events[0].data.something);
            assert.equal(0, events[0].positionEventNumber);
            assert.equal('$ce-TestStream', events[0].positionStreamId);
        });
    });
});