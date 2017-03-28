require('./_globalHooks');

var httpConfig = require('./support/httpConfig');
var eventstore = require('../index.js');
var assert = require('assert');
var uuid = require('uuid');
var _ = require('lodash');

describe('Http Client - Get Events', () => {

    var testStream = `TestStream-${uuid.v4()}`;
    var numberOfEvents = 10;

    before(() => {
        var client = eventstore.http(httpConfig);

        var events = [];

        for (var i = 1; i <= numberOfEvents; i++) {
            events.push(eventstore.eventFactory.NewEvent('TestEventType', {
                something: i
            }));
        }

        return client.writeEvents(testStream, events);
    });

    it('Should get events reading forward', () => {
        var client = eventstore.http(httpConfig);

        return client.getEvents(testStream, undefined, undefined, 'forward').then(events => {
            assert.equal(events.length, 10);
            assert.equal(events[0].data.something, 1);
        });
    });

    it('Should get events reading backward', () => {
        var client = eventstore.http(httpConfig);

        return client.getEvents(testStream, 'head', undefined, 'backward').then(events => {
            assert.equal(events.length, 10);
            assert.equal(events[0].data.something, 10);
        });
    });

    it('Should get last event reading backward with larger size than events', () => {
        var client = eventstore.http(httpConfig);

        return client.getEvents(testStream, 0, 250, 'backward').then(events => {
            assert.equal(events.length, 1);
            assert.equal(events[0].data.something, 1);
        });
    });

    it('Should not get any events when start event is greater than the stream length', () => {
        var client = eventstore.http(httpConfig);

        return client.getEvents(testStream, 11).then(events => {
            assert.equal(events.length, 0);
        });
    });

    it('Should get events reading backward from a start position', () => {
        var client = eventstore.http(httpConfig);

        return client.getEvents(testStream, 2, undefined, 'backward').then(events => {
            assert.equal(events.length, 3);
            assert.equal(events[0].data.something, 3);
        });
    });

    it('Should get events reading backward with a length greater than the stream length', () => {
        var client = eventstore.http(httpConfig);

        return client.getEvents(testStream, undefined, 10000, 'backward').then(events => {
            assert.equal(events.length, 10);
            assert.equal(events[0].data.something, 10);
        });
    });

    it('Should get events reading forward with a length greater than the stream length return a maximum of 4096', function() {
        this.timeout(10000);
        var client = eventstore.http(httpConfig);

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
        var client = eventstore.http(httpConfig);

        return client.getEvents('$ce-TestStream', 0, 1, 'forward').then(events => {
            assert.equal(events.length, 1);
            assert(events[0].data.something);
            assert.equal(0, events[0].positionEventNumber);
            assert.equal('$ce-TestStream', events[0].positionStreamId);
        });
    });
});

describe('Http Client - Get Events Failure', () => {
    var testStream = `TestStream-${uuid.v4()}`;

    it('Should return 404 when stream does not exist', () => {
        var client = eventstore.http(httpConfig);

        return client.getEvents(testStream, undefined, undefined, 'forward').then(() => {
            throw new Error('Should not have received events');
        }).catch(err => {
            assert.equal(404, err.statusCode, 'Should have received 404');
        });
    });

    it('Should not return 404 when stream does not exist if ignore 404 is set on config', () => {
        var httpConfigWithIgnore = _.cloneDeep(httpConfig);
        httpConfigWithIgnore.ignore = [404];

        var client = eventstore.http(httpConfigWithIgnore);

        return client.getEvents(testStream, undefined, undefined, 'forward').then(() => {
            throw new Error('Should not have received events');
        }).catch(err => {
            assert.equal(404, err.statusCode, 'Should have received 404');
        });
    });
});