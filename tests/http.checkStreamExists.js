var assert = require('assert');
var eventstore = require('../index.js');
var uuid = require('node-uuid');

describe('Http Client - Check Stream Exist', function() {
    it('Should return true when a stream exist', function() {
        var client = eventstore.http({
            http: {
                hostname: 'localhost',
                protocol: 'http',
                port: 2113,
                credentials: {
                    username: 'admin',
                    password: 'changeit'
                }
            }
        });

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
        var client = eventstore.http({
            http: {
                hostname: 'localhost',
                protocol: 'http',
                port: 2113,
                credentials: {
                    username: 'admin',
                    password: 'changeit'
                }
            }
        });

        return client.checkStreamExists('Non-existentStream').then(function(exists) {
            assert.equal(exists, false);
        });
    });
});