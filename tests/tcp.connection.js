require('./_globalHooks');

var tcpConfig = require('./support/tcpConfig');
var assert = require('assert');
var eventstore = require('../index.js');
var uuid = require('uuid');

describe('TCP Client - Test Connection', function() {
    it('Should connect and write event on correct connection properties', function() {
        var client = eventstore.tcp(tcpConfig);
        var testStream = 'TestStream-' + uuid.v4();
        return client.writeEvent(testStream, 'TestEventType', {
            something: '123'
        });
    });

    it('Should not connect on incorrect hostname', function() {
        this.timeout(60 * 1000);
        var config = JSON.parse(JSON.stringify(tcpConfig));
        config.hostname = 'MadeToFailHostName';

        var client = eventstore.tcp(config);

        var testStream = 'TestStream-' + uuid.v4();
        return client.writeEvent(testStream, 'TestEventType', {
            something: '123'
        }).then(function() {
            assert.fail('Should not have written event successfully');
        }).catch(function(err) {
            assert(err.message);
        });
    });

    it('Should not connect on incorrect port', function() {
        this.timeout(60 * 1000);
        var config = JSON.parse(JSON.stringify(tcpConfig));
        config.port = 9999;

        var client = eventstore.tcp(config);

        var testStream = 'TestStream-' + uuid.v4();
        return client.writeEvent(testStream, 'TestEventType', {
            something: '123'
        }).then(function() {
            assert.fail('Should not have written event successfully');
        }).catch(function(err) {
            assert(err.message);
        });
    });
});