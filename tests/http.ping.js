var httpConfig = require('./support/httpConfig');
var assert = require('assert');
var eventstore = require('../index.js');

describe('Http Client - Ping', function() {
    it('Should return successful when OK', function() {
        var client = eventstore.http(httpConfig);

        return client.ping().catch(function(err) {
            assert.fail(err.message);
        });
    });

    it('Should fail when not OK', function() {
        this.timeout(30000);
        var config = JSON.parse(JSON.stringify(httpConfig));
        config.hostname = 'MadeToFailHostName';

        var client = eventstore.http(config);

        return client.ping().then(function() {
            assert.fail('Should not succeed');
        }).catch(function(err) {
            assert(err.message);
        });
    });
});
