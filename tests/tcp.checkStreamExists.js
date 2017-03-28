require('./_globalHooks');

var tcpConfig = require('./support/tcpConfig');
var eventstore = require('../index.js');
var assert = require('assert');
var uuid = require('uuid');

describe('TCP Client - Check Stream Exist', function() {
    it('Should return true when a stream exist', function() {
        this.timeout(5000);
        var client = eventstore.tcp(tcpConfig);

        var testStream = `TestStream-${uuid.v4()}`;
        return client.writeEvent(testStream, 'TestEventType', {
            something: '123'
        }).then(function() {
            return client.checkStreamExists(testStream).then(function(exists) {
                assert.equal(true, exists);
            });
        });
    });

    it('Should return false when a stream does not exist', function() {
        this.timeout(5000);
        var client = eventstore.tcp(tcpConfig);

        return client.checkStreamExists('Non_existentStream').then(function(exists) {
            assert.equal(false, exists);
        });
    });
});