var assert = require('assert');
var eventstore = require('../index.js');
var uuid = require('node-uuid');

describe('TCP Client - Event Enumerator', function() {
    describe('Reading events', function() {
        it('Read next events', function() {
            var client = eventstore.tcp({
                tcp: {
                    hostname: 'localhost',
                    protocol: 'tcp',
                    port: 1113,
                    credentials: {
                        username: 'admin',
                        password: 'changeit'
                    }
                }
            });

            var events = [];
            for (var k = 0; k < 100; k++) {
                events.push(eventstore.eventFactory.NewEvent('TestEventType', {
                    id: k
                }));
            }

            var testStream = 'TestStream-' + uuid.v4();
            return client.writeEvents(testStream, events).then(function() {
                var enumerator = client.eventEnumerator(testStream);
                return enumerator.next(20).then(function(result) {
                    assert.equal(result.events.length, 20);
                    assert.equal(result.events[0].data.id, 0);
                    assert.equal(result.events[19].data.id, 19);

                    return enumerator.next(20).then(function(result) {
                        assert.equal(result.events.length, 20);
                        assert.equal(result.events[0].data.id, 20);
                        assert.equal(result.events[19].data.id, 39);
                    });
                });
            });
        });

        it('Forward - Read first 10 events, next 20 events, previous 30 events', function() {
            var client = eventstore.tcp({
                tcp: {
                    hostname: 'localhost',
                    protocol: 'tcp',
                    port: 1113,
                    credentials: {
                        username: 'admin',
                        password: 'changeit'
                    }
                }
            });

            var events = [];
            for (var k = 1; k <= 100; k++) {
                events.push(eventstore.eventFactory.NewEvent('TestEventType', {
                    id: k
                }));
            }

            var testStream = 'TestStream-' + uuid.v4();
            return client.writeEvents(testStream, events).then(function() {
                var enumerator = client.eventEnumerator(testStream);
                return enumerator.first(10).then(function(result) {
                    assert.equal(result.events.length, 10);
                    assert.equal(result.events[0].data.id, 1);
                    assert.equal(result.events[9].data.id, 10);

                    return enumerator.next(20).then(function(result) {
                        assert.equal(result.events.length, 20);
                        assert.equal(result.events[0].data.id, 11);
                        assert.equal(result.events[19].data.id, 30);

                        return enumerator.previous(30).then(function(result) {
                            assert.equal(result.events.length, 30);
                            assert.equal(result.events[0].data.id, 1);
                            assert.equal(result.events[29].data.id, 30);
                        });
                    });
                });
            });
        });

        it('Forward - Read last 10 events, previous 20 events, next 30 events', function() {
            var client = eventstore.tcp({
                tcp: {
                    hostname: 'localhost',
                    protocol: 'tcp',
                    port: 1113,
                    credentials: {
                        username: 'admin',
                        password: 'changeit'
                    }
                }
            });

            var events = [];
            for (var k = 1; k <= 100; k++) {
                events.push(eventstore.eventFactory.NewEvent('TestEventType', {
                    id: k
                }));
            }

            var testStream = 'TestStream-' + uuid.v4();
            return client.writeEvents(testStream, events).then(function() {
                var enumerator = client.eventEnumerator(testStream);
                return enumerator.last(10).then(function(result) {
                    assert.equal(result.events.length, 10);
                    assert.equal(result.events[0].data.id, 91);
                    assert.equal(result.events[9].data.id, 100);

                    return enumerator.previous(20).then(function(result) {
                        assert.equal(result.events.length, 20);
                        assert.equal(result.events[0].data.id, 71);
                        assert.equal(result.events[19].data.id, 90);

                        return enumerator.next(30).then(function(result) {
                            assert.equal(result.events.length, 30);
                            assert.equal(result.events[0].data.id, 71);
                            assert.equal(result.events[29].data.id, 100);
                        });
                    });
                });
            });
        });

        it('Read first and last batch', function() {
            var client = eventstore.tcp({
                tcp: {
                    hostname: 'localhost',
                    protocol: 'tcp',
                    port: 1113,
                    credentials: {
                        username: 'admin',
                        password: 'changeit'
                    }
                }
            });

            var events = [];
            for (var k = 0; k < 100; k++) {
                events.push(eventstore.eventFactory.NewEvent('TestEventType', {
                    id: k
                }));
            }

            var testStream = 'TestStream-' + uuid.v4();
            return client.writeEvents(testStream, events).then(function() {
                var enumerator = client.eventEnumerator(testStream);
                return enumerator.first(20).then(function(result) {
                    assert.equal(result.events.length, 20);
                    assert.equal(result.events[0].data.id, 0);
                    assert.equal(result.events[19].data.id, 19);

                    return enumerator.last(20).then(function(result) {
                        assert.equal(result.events.length, 20);
                        assert.equal(result.events[0].data.id, 80);
                        assert.equal(result.events[19].data.id, 99);
                    });
                });
            });
        });
    });
});