require('./_globalHooks');

var tcpConfig = require('./support/tcpConfig');
var eventstore = require('../index.js');
var Promise = require('bluebird');
var assert = require('assert');
var uuid = require('uuid');
var _ = require('lodash');

describe('TCP Client - Stress Tests', function() {
    it('Should handle parallel writes', function() {
        this.timeout(20000);
        var client = eventstore.tcp(tcpConfig);

        var testStream = 'TestStream-' + uuid.v4();
        var numberOfEvents = 5000;
        var events = [];

        for (var i = 1; i <= numberOfEvents; i++) {
            events.push(eventstore.eventFactory.NewEvent('TestEventType', {
                something: i
            }));
        }

        return Promise.map(events, function(ev) {
            return client.writeEvent(testStream, ev.eventType, ev.data);

        }).then(function() {
            return client.getEvents(testStream, undefined, 5000).then(function(events) {
                assert.equal(events.length, 4096);
            });
        });
    });

    it('Should handle parallel reads and writes', function(callback) {
        this.timeout(60000);
        var client = eventstore.tcp(tcpConfig);

        var testStream = 'TestStream-' + uuid.v4();
        var numberOfEvents = 5000;
        var events = [];
        var writeCount = 0;
        var readCount = 0;

        for (var i = 1; i <= numberOfEvents; i++) {
            events.push(eventstore.eventFactory.NewEvent('TestEventType', {
                something: i
            }));
        }

        var checkCounts = function() {
            if (readCount === numberOfEvents && writeCount === numberOfEvents && writeCount === readCount) callback();
        };

        _.each(events, function(ev) {
            client.writeEvent(testStream, ev.eventType, ev.data).then(function() {
                writeCount++;
                checkCounts();
            });
        });
        _.each(events, function() {
            client.getEvents(testStream, undefined, 10).then(function() {
                readCount++;
                checkCounts();
            });
        });
    });
});