require('./_globalHooks');

const httpConfig = require('./support/httpConfig');
const eventstore = require('../index.js');
const Promise = require('bluebird');
const assert = require('assert');
const uuid = require('uuid');
const _ = require('lodash');

describe('HTTP Client - Persistent Subscription', () => {
    it('Should get and ack first batch of events written to a stream', function() {
        this.timeout(9 * 1000);
        const client = eventstore.http(httpConfig);
        const testStream = `TestStream-${uuid.v4()}`;

        const events = [];
        for (let k = 0; k < 10; k++) {
            events.push(eventstore.eventFactory.NewEvent('TestEventType', {
                id: k
            }));
        }

        const testSubscriptionName = testStream;

        return client.writeEvents(testStream, events).then(() => client.persistentSubscriptions.assert(testSubscriptionName, testStream).then(() => client.persistentSubscriptions.getEvents(testSubscriptionName, testStream, 10).then(result => {
            assert.equal(10, result.entries.length);
            return result.ackAll().then(() => client.persistentSubscriptions.getEvents(testSubscriptionName, testStream, 10).then(result => {
                assert.equal(0, result.entries.length);
            }));
        })));
    });

    it('Should ack and nack messages individually', function() {
        this.timeout(9 * 1000);
        const client = eventstore.http(httpConfig);
        const testStream = `TestStream-${uuid.v4()}`;

        const events = [];
        for (let k = 0; k < 12; k++) {
            events.push(eventstore.eventFactory.NewEvent('TestEventType', {
                id: k
            }));
        }

        const testSubscriptionName = testStream;

        return client.writeEvents(testStream, events).then(() => client.persistentSubscriptions.assert(testSubscriptionName, testStream).then(() => client.persistentSubscriptions.getEvents(testSubscriptionName, testStream, 100).then(result => {
            assert.equal(12, result.entries.length);
            const chunks = _.chunk(result.entries, 4);
            return Promise.map(chunks[0], entry => entry.nack()).then(() => Promise.map(chunks[1], entry => entry.ack()).then(() => Promise.map(chunks[2], entry => entry.nack()).then(() => client.persistentSubscriptions.getEvents(testSubscriptionName, testStream, 10).then(result => {
                assert.equal(8, result.entries.length);
                assert.equal(0, result.entries[7].event.data.id);
                assert.equal(1, result.entries[6].event.data.id);
                assert.equal(2, result.entries[5].event.data.id);
                assert.equal(3, result.entries[4].event.data.id);
                assert.equal(8, result.entries[3].event.data.id);
                assert.equal(9, result.entries[2].event.data.id);
                assert.equal(10, result.entries[1].event.data.id);
                assert.equal(11, result.entries[0].event.data.id);
            }))));
        })));
    });

    it('Should update persistent subscription ', function() {
        this.timeout(9 * 1000);
        const client = eventstore.http(httpConfig);
        const testStream = `TestStream-${uuid.v4()}`;

        const events = [];
        for (let k = 0; k < 12; k++) {
            events.push(eventstore.eventFactory.NewEvent('TestEventType', {
                id: k
            }));
        }

        const testSubscriptionName = testStream;

        return client.writeEvents(testStream, events).then(() => client.persistentSubscriptions.assert(testSubscriptionName, testStream).then(() => {
            const options = {
                readBatchSize: 121,
            };
            return client.persistentSubscriptions.assert(testSubscriptionName, testStream, options).then(() => client.persistentSubscriptions.getSubscriptionInfo(testSubscriptionName, testStream).then(result => {
                assert.equal(options.readBatchSize, result.config.readBatchSize);
            }));
        }));
    });

    it('Should delete persistent subscription', function(done) {
        this.timeout(9 * 1000);
        const client = eventstore.http(httpConfig);
        const testStream = `TestStream-${uuid.v4()}`;

        const events = [];
        for (let k = 0; k < 12; k++) {
            events.push(eventstore.eventFactory.NewEvent('TestEventType', {
                id: k
            }));
        }

        const testSubscriptionName = testStream;

        return client.writeEvents(testStream, events).then(() => client.persistentSubscriptions.assert(testSubscriptionName, testStream).then(() => client.persistentSubscriptions.remove(testSubscriptionName, testStream).then(() => client.persistentSubscriptions.getEvents(testSubscriptionName, testStream, 10).then(() => {
            done('Should have not gotten events');
        }).catch(err => {
            try {
                assert.equal(404, err.statusCode, 'Should have received 404');
            } catch (ex) {
                done(ex.message);
            }
            done();
        })))).catch(done);
    });

    it('Should return persistent subscription info', function() {
        this.timeout(9 * 1000);
        const client = eventstore.http(httpConfig);
        const testStream = `TestStream-${uuid.v4()}`;

        const events = [];
        for (let k = 0; k < 10; k++) {
            events.push(eventstore.eventFactory.NewEvent('TestEventType', {
                id: k
            }));
        }

        const testSubscriptionName = testStream;

        return client.writeEvents(testStream, events).then(() => client.persistentSubscriptions.assert(testSubscriptionName, testStream).then(() => client.persistentSubscriptions.getSubscriptionInfo(testSubscriptionName, testStream).then(result => {
            assert.equal(testSubscriptionName, result.groupName);
            assert.equal(testStream, result.eventStreamId);
        })));
    });

    it('Should return persistent subscriptions info for a stream', function() {
        this.timeout(9 * 1000);
        const client = eventstore.http(httpConfig);
        const testStream = `TestStream-${uuid.v4()}`;

        const events = [];
        for (let k = 0; k < 10; k++) {
            events.push(eventstore.eventFactory.NewEvent('TestEventType', {
                id: k
            }));
        }

        const testSubscriptionName = testStream;

        return client.writeEvents(testStream, events).then(() => client.persistentSubscriptions.assert(testSubscriptionName, testStream).then(() => client.persistentSubscriptions.getStreamSubscriptionsInfo(testStream).then(results => {
            assert.equal(1, results.length);
        })));
    });

    it('Should return persistent subscriptions info for all', function() {
        this.timeout(9 * 1000);
        const client = eventstore.http(httpConfig);
        const testStream = `TestStream-${uuid.v4()}`;

        const events = [];
        for (let k = 0; k < 10; k++) {
            events.push(eventstore.eventFactory.NewEvent('TestEventType', {
                id: k
            }));
        }

        const testSubscriptionName = testStream;

        return client.writeEvents(testStream, events).then(() => client.persistentSubscriptions.assert(testSubscriptionName, testStream).then(() => client.persistentSubscriptions.getAllSubscriptionsInfo().then(results => {
            assert.equal(6, results.length);
        })));
    });
});