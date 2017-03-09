require('./_globalHooks');

var httpConfig = require('./support/httpConfig');
var assert = require('assert');
var eventstore = require('../index.js');

describe('Http Client - Config', function() {
    it('Should return assertion error when config is undefined', function(done) {
        try {
            var client = eventstore.http();
            done('Config should not pass assertion');
        } catch (err) {
            assert.equal(err === undefined, false);
            assert.equal(err.message, 'geteventstore-promise - HTTP client - config not provided');
            done();
        }
    });

    it('Should return assertion error when hostname is undefined', function(done) {
        try {
            var config = {
                port: 2113,
                credentials: {
                    username: 'admin',
                    password: 'changeit'
                }
            };
            var client = eventstore.http(config);
            done();
        } catch (err) {
            assert.equal(err === undefined, false);
            assert.equal(err.message, 'geteventstore-promise - HTTP client - hostname property not provided');
            done();
        }
    });

    it('Should return assertion error when credentials are undefined', function(done) {
        try {
            var config = {
                hostname: 'localhost',
                port: 2113
            };
            var client = eventstore.http(config);
            done();
        } catch (err) {
            assert.equal(err === undefined, false);
            assert.equal(err.message, 'geteventstore-promise - HTTP client - credentials property not provided');
            done();
        }
    });

    it('Should return http client when config is complete', function(done) {
        try {
            var client = eventstore.http(httpConfig);
            assert.equal(client !== undefined, true);
            done();
        } catch (err) {
            done(err);
        }
    });
});