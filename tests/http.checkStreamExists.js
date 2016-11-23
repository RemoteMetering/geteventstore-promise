var globalHooks = require('./_globalHooks');

var httpConfig = require('./support/httpConfig');
var assert = require('assert');
var eventstore = require('../index.js');
var uuid = require('uuid');

describe('Http Client - Check Stream Exist', function() {
    it('Should return true when a stream exist', function() {
        var client = eventstore.http(httpConfig);

        var testStream = 'TestStream-' + uuid.v4();
        return client.writeEvent(testStream, 'TestEventType', {
            something: '123'
        }).then(function() {
            return client.checkStreamExists(testStream).then(function(exists) {
                assert.equal(exists, true);
            });
        });
    });

    it('Should return false when a stream does not exist', function() {
        var client = eventstore.http(httpConfig);

        return client.checkStreamExists('Non-existentStream').then(function(exists) {
            assert.equal(exists, false);
        });
    });
});