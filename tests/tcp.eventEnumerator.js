var tcpConfig = require('./support/tcpConfig');
var assert = require('assert');
var eventstore = require('../index.js');
var uuid = require('node-uuid');

describe('TCP Client - Event Enumerator', function() {
    describe('Forward: Reading events', function() {
        it('Read next events', function() {
            var client = eventstore.tcp(tcpConfig);

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

        it('Read first 10 events, next 20 events, previous 30 events', function() {
            var client = eventstore.tcp(tcpConfig);

            var events = [];
            for (var k = 0; k < 100; k++) {
                events.push(eventstore.eventFactory.NewEvent('TestEventType', {
                    id: k
                }));
            }

            var testStream = 'TestStream-' + uuid.v4();
            return client.writeEvents(testStream, events).then(function() {
                var enumerator = client.eventEnumerator(testStream);
                return enumerator.first(10).then(function(result) {
                    assert.equal(result.events.length, 10);
                    assert.equal(result.events[0].data.id, 0);
                    assert.equal(result.events[9].data.id, 9);

                    return enumerator.next(20).then(function(result) {
                        assert.equal(result.events.length, 20);
                        assert.equal(result.events[0].data.id, 10);
                        assert.equal(result.events[19].data.id, 29);

                        return enumerator.previous(30).then(function(result) {
                            assert.equal(result.events.length, 30);
                            assert.equal(result.events[0].data.id, 0);
                            assert.equal(result.events[29].data.id, 29);
                        });
                    });
                });
            });
        });

        it('Read last 10 events, previous 30 events, next 30 events', function() {
            var client = eventstore.tcp(tcpConfig);

            var events = [];
            for (var k = 0; k < 100; k++) {
                events.push(eventstore.eventFactory.NewEvent('TestEventType', {
                    id: k
                }));
            }

            var testStream = 'TestStream-' + uuid.v4();
            return client.writeEvents(testStream, events).then(function() {
                var enumerator = client.eventEnumerator(testStream);
                return enumerator.last(10).then(function(result) {
                    assert.equal(result.events.length, 10);
                    assert.equal(result.events[0].data.id, 90);
                    assert.equal(result.events[9].data.id, 99);

                    return enumerator.previous(30).then(function(result) {
                        assert.equal(result.events.length, 30);
                        assert.equal(result.events[0].data.id, 70);
                        assert.equal(result.events[29].data.id, 99);

                        return enumerator.next(30).then(function(result) {
                            assert.equal(result.events.length, 30);
                            assert.equal(result.events[0].data.id, 70);
                            assert.equal(result.events[29].data.id, 99);
                        });
                    });
                });
            });
        });

        it('Read first and last batch', function() {
            var client = eventstore.tcp(tcpConfig);

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

        it('Handle out of bounds Enumeration Request ', function() {
            var client = eventstore.tcp(tcpConfig);

            var events = [];
            for (var k = 0; k < 100; k++) {
                events.push(eventstore.eventFactory.NewEvent('TestEventType', {
                    id: k
                }));
            }

            var testStream = 'TestStream-' + uuid.v4();
            return client.writeEvents(testStream, events).then(function() {
                var enumerator = client.eventEnumerator(testStream);
                return enumerator.first(95).then(function(result) {
                    assert.equal(result.events.length, 95);
                    assert.equal(result.events[0].data.id, 0);
                    assert.equal(result.events[94].data.id, 94);

                    return enumerator.next(20).then(function(result) {
                        assert.equal(result.events.length, 5);
                        assert.equal(result.events[0].data.id, 95);
                        assert.equal(result.events[4].data.id, 99);

                        return enumerator.first(10).then(function(result) {
                            assert.equal(result.events.length, 10);
                            assert.equal(result.events[0].data.id, 0);
                            assert.equal(result.events[9].data.id, 9);

                            return enumerator.previous(20).then(function(result) {
                                assert.equal(result.events.length, 10);
                                assert.equal(result.events[0].data.id, 0);
                                assert.equal(result.events[9].data.id, 9);
                            });
                        });
                    });
                });
            });
        });
    });

    describe('Backward: Reading events', function() {
        it('Read next events', function() {
            var client = eventstore.tcp(tcpConfig);

            var events = [];
            for (var k = 0; k < 100; k++) {
                events.push(eventstore.eventFactory.NewEvent('TestEventType', {
                    id: k
                }));
            }

            var testStream = 'TestStream-' + uuid.v4();
            return client.writeEvents(testStream, events).then(function() {
                var enumerator = client.eventEnumerator(testStream, 'backward');
                return enumerator.next(20).then(function(result) {
                    assert.equal(result.events.length, 20);
                    assert.equal(result.events[0].data.id, 99);
                    assert.equal(result.events[19].data.id, 80);

                    return enumerator.next(20).then(function(result) {
                        assert.equal(result.events.length, 20);
                        assert.equal(result.events[0].data.id, 79);
                        assert.equal(result.events[19].data.id, 60);
                    });
                });
            });
        });

        it('Read first 10 events, next 20 events, previous 30 events', function() {
            var client = eventstore.tcp(tcpConfig);

            var events = [];
            for (var k = 0; k < 100; k++) {
                events.push(eventstore.eventFactory.NewEvent('TestEventType', {
                    id: k
                }));
            }

            var testStream = 'TestStream-' + uuid.v4();
            return client.writeEvents(testStream, events).then(function() {
                var enumerator = client.eventEnumerator(testStream, 'backward');
                return enumerator.first(10).then(function(result) {
                    assert.equal(result.events.length, 10);
                    assert.equal(result.events[0].data.id, 99);
                    assert.equal(result.events[9].data.id, 90);

                    return enumerator.next(20).then(function(result) {
                        assert.equal(result.events.length, 20);
                        assert.equal(result.events[0].data.id, 89);
                        assert.equal(result.events[19].data.id, 70);

                        return enumerator.previous(30).then(function(result) {
                            assert.equal(result.events.length, 30);
                            assert.equal(result.events[0].data.id, 99);
                            assert.equal(result.events[29].data.id, 70);
                        });
                    });
                });
            });
        });

        it('Read last 10 events, previous 20 events, next 30 events', function() {
            var client = eventstore.tcp(tcpConfig);

            var events = [];
            for (var k = 0; k < 100; k++) {
                events.push(eventstore.eventFactory.NewEvent('TestEventType', {
                    id: k
                }));
            }

            var testStream = 'TestStream-' + uuid.v4();
            return client.writeEvents(testStream, events).then(function() {
                var enumerator = client.eventEnumerator(testStream, 'backward');
                return enumerator.last(10).then(function(result) {
                    assert.equal(result.events.length, 10);
                    assert.equal(result.events[0].data.id, 9);
                    assert.equal(result.events[9].data.id, 0);

                    return enumerator.previous(30).then(function(result) {
                        assert.equal(result.events.length, 30);
                        assert.equal(result.events[0].data.id, 29);
                        assert.equal(result.events[29].data.id, 0);

                        return enumerator.next(30).then(function(result) {
                            assert.equal(result.events.length, 30);
                            assert.equal(result.events[0].data.id, 29);
                            assert.equal(result.events[29].data.id, 0);
                        });
                    });
                });
            });
        });

        it('Read first and last batch', function() {
            var client = eventstore.tcp(tcpConfig);

            var events = [];
            for (var k = 0; k < 100; k++) {
                events.push(eventstore.eventFactory.NewEvent('TestEventType', {
                    id: k
                }));
            }

            var testStream = 'TestStream-' + uuid.v4();
            return client.writeEvents(testStream, events).then(function() {
                var enumerator = client.eventEnumerator(testStream, 'backward');
                return enumerator.first(20).then(function(result) {
                    assert.equal(result.events.length, 20);
                    assert.equal(result.events[0].data.id, 99);
                    assert.equal(result.events[19].data.id, 80);

                    return enumerator.last(20).then(function(result) {
                        assert.equal(result.events.length, 20);
                        assert.equal(result.events[0].data.id, 19);
                        assert.equal(result.events[19].data.id, 0);
                    });
                });
            });
        });

        it('Handle out of bounds Enumeration Request ', function() {
            var client = eventstore.tcp(tcpConfig);

            var events = [];
            for (var k = 0; k < 100; k++) {
                events.push(eventstore.eventFactory.NewEvent('TestEventType', {
                    id: k
                }));
            }

            var testStream = 'TestStream-' + uuid.v4();
            return client.writeEvents(testStream, events).then(function() {
                var enumerator = client.eventEnumerator(testStream, 'backward');
                return enumerator.first(95).then(function(result) {
                    assert.equal(result.events.length, 95);
                    assert.equal(result.events[0].data.id, 99);
                    assert.equal(result.events[94].data.id, 5);

                    return enumerator.next(20).then(function(result) {
                        assert.equal(result.events.length, 5);
                        assert.equal(result.events[0].data.id, 4);
                        assert.equal(result.events[4].data.id, 0);

                        return enumerator.first(10).then(function(result) {
                            assert.equal(result.events.length, 10);
                            assert.equal(result.events[0].data.id, 99);
                            assert.equal(result.events[9].data.id, 90);

                            return enumerator.previous(20).then(function(result) {
                                assert.equal(result.events.length, 10);
                                assert.equal(result.events[0].data.id, 99);
                                assert.equal(result.events[9].data.id, 90);
                            });
                        });
                    });
                });
            });
        });
    });
});