require('./_globalHooks');

var httpConfig = require('./support/httpConfig');
var eventstore = require('../index.js');
var assert = require('assert');
var uuid = require('uuid');

describe('Http Client - Delete stream', function() {
    it('Should return successful on stream delete', function() {
        var client = eventstore.http(httpConfig);

        var testStream = 'TestStream-' + uuid.v4();
        return client.writeEvent(testStream, 'TestEventType', {
            something: '123'
        }).then(function() {
            return client.deleteStream(testStream).then(function() {
                return client.checkStreamExists(testStream).then(function(exists) {
                    assert.equal(false, exists);
                });
            }).catch(function(err) {
                assert.fail(err.message);
            });
        });
    });

    it('Should return successful on writing to a stream that has been soft deleted', function() {
        var client = eventstore.http(httpConfig);

        var testStream = 'TestStream-' + uuid.v4();

        return client.writeEvent(testStream, 'TestEventType', {
            something: '123'
        }).then(function() {
            return client.deleteStream(testStream).then(function() {
                return client.writeEvent(testStream, 'TestEventType', {
                    something: '456'
                });
            }).catch(function(err) {
                assert.fail(err.message);
            });
        });
    });

    it('Should return successful on stream delete hard delete', function(callback) {
        var client = eventstore.http(httpConfig);

        var testStream = 'TestStream-' + uuid.v4();
        client.writeEvent(testStream, 'TestEventType', {
            something: '123'
        }).then(function() {
            return client.deleteStream(testStream, true).then(function() {
                return client.checkStreamExists(testStream).then(function() {
                    callback('Should not have returned resolved promise');
                }).catch(function(err) {
                    assert(err.message.indexOf('410') > -1, 'Expected http 410');
                    callback();
                });
            }).catch(callback);
        }).catch(callback);
    });

    it('Should fail when a stream does not exist', function() {
        var client = eventstore.http(httpConfig);

        var testStream = 'TestStream-' + uuid.v4();

        return client.deleteStream(testStream).then(function() {
            assert.fail('Should have failed because stream does not exist');
        }).catch(function(err) {
            assert(err);
        });
    });

    it('Should return HTTP 410 when a writing to a stream that has been hard deleted', function() {
        var client = eventstore.http(httpConfig);

        var testStream = 'TestStream-' + uuid.v4();

        return client.writeEvent(testStream, 'TestEventType', {
            something: '123'
        }).then(function() {
            return client.deleteStream(testStream, true).then(function() {
                return client.writeEvent(testStream, 'TestEventType', {
                    something: '456'
                }).then(function() {
                    assert.fail('Should have failed because stream does not exist');
                });
            }).catch(function(err) {
                assert.equal(410, err.statusCode);
            });
        });
    });
});