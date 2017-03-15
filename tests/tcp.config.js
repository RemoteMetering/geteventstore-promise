require('./_globalHooks');

var tcpConfig = require('./support/tcpConfig');
var eventstore = require('../index.js');
var assert = require('assert');

describe('TCP Client - Config', function() {
    it('Should return assertion error when config is undefined', function(done) {
        try {
            eventstore.tcp();
            done('Config should not pass assertion');
        } catch (err) {
            assert.equal(err === undefined, false);
            assert.equal(err.message, 'geteventstore-promise - TCP client - config not provided');
            done();
        }
    });

    it('Should return assertion error when hostname is undefined', function(done) {
        try {
            var config = {
                port: 1113,
                credentials: {
                    username: 'admin',
                    password: 'changeit'
                }
            };
            eventstore.tcp(config);
            done();
        } catch (err) {
            assert.equal(err === undefined, false);
            assert.equal(err.message, 'geteventstore-promise - TCP client - hostname property not provided');
            done();
        }
    });

    it('Should return assertion error when credentials are undefined', function(done) {
        try {
            var config = {
                hostname: 'localhost',
                port: 1113
            };
            eventstore.tcp(config);
            done();
        } catch (err) {
            assert.equal(err === undefined, false);
            assert.equal(err.message, 'geteventstore-promise - TCP client - credentials property not provided');
            done();
        }
    });

    it('Should return tcp client when config is complete', function(done) {
        try {
            var client = eventstore.tcp(tcpConfig);
            assert.equal(client !== undefined, true);
            done();
        } catch (err) {
            done(err);
        }
    });
});