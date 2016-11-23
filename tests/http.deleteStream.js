var globalHooks = require('./_globalHooks');

var httpConfig = require('./support/httpConfig');
var assert = require('assert');
var eventstore = require('../index.js');
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

    it('Should fail when a stream does not exist', function() {
        var client = eventstore.http(httpConfig);

        var testStream = 'TestStream-' + uuid.v4();

        return client.deleteStream(testStream).then(function() {
            assert.fail('Should have failed because stream does not exist');
        }).catch(function(err){
            assert(err);
        });
    });
});