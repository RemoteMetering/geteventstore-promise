require('./_globalHooks');

var httpConfig = require('./support/httpConfig');
var eventstore = require('../index.js');
var assert = require('assert');

describe('Http Client - Config', () => {
    it('Should return assertion error when config is undefined', done => {
        try {
            eventstore.http();
            done('Config should not pass assertion');
        } catch (err) {
            assert.equal(err === undefined, false);
            assert.equal(err.message, 'geteventstore-promise - HTTP client - config not provided');
            done();
        }
    });

    it('Should return assertion error when hostname is undefined', done => {
        try {
            var config = {
                port: 2113,
                credentials: {
                    username: 'admin',
                    password: 'changeit'
                }
            };
            eventstore.http(config);
            done();
        } catch (err) {
            assert.equal(err === undefined, false);
            assert.equal(err.message, 'geteventstore-promise - HTTP client - hostname property not provided');
            done();
        }
    });

    it('Should return assertion error when credentials are undefined', done => {
        try {
            var config = {
                hostname: 'localhost',
                port: 2113
            };
            eventstore.http(config);
            done();
        } catch (err) {
            assert.equal(err === undefined, false);
            assert.equal(err.message, 'geteventstore-promise - HTTP client - credentials property not provided');
            done();
        }
    });

    it('Should return http client when config is complete', done => {
        try {
            var client = eventstore.http(httpConfig);
            assert.equal(client !== undefined, true);
            done();
        } catch (err) {
            done(err);
        }
    });
});