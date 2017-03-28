require('./_globalHooks');

var httpConfig = require('./support/httpConfig');
var eventstore = require('../index.js');
var assert = require('assert');
var uuid = require('uuid');
var _ = require('lodash');

describe('Http Client - Check Stream Exist', () => {
    it('Should return true when a stream exist', function() {
       this.timeout(10 * 1000);
        var client = eventstore.http(httpConfig);

        var testStream = `TestStream-${uuid.v4()}`;
        return client.writeEvent(testStream, 'TestEventType', {
            something: '123'
        }).then(() => client.checkStreamExists(testStream).then(exists => {
            assert.equal(exists, true);
        }));
    });

    it('Should return false when a stream does not exist', () => {
        var client = eventstore.http(httpConfig);

        return client.checkStreamExists('Non_existentStream').then(exists => {
            assert.equal(exists, false);
        });
    });

    it('Should return rejected promise when the request error is anything other than a 404', callback => {
        var config = _.cloneDeep(httpConfig);
        config.port = 1;
        var client = eventstore.http(config);

        client.checkStreamExists('Non_existentStream_wrong_port_config').then(() => {
            callback('Should not have returned successful promise');
        }).catch(err => {
            assert(err, 'No error received');
            assert(err.message.indexOf('ECONNREFUSED') > -1, 'Connection refused error expected');
            callback();
        });
    });

    it('Should throw an exception when timeout is reached', callback => {
        var clonedConfig = _.cloneDeep(httpConfig);
        clonedConfig.timeout = 1;

        var client = eventstore.http(clonedConfig);
        var testStream = `TestStream-${uuid.v4()}`;
        client.writeEvent(testStream, 'TestEventType', {
            something: '123'
        }).then(() => client.checkStreamExists(testStream).then(() => {
            callback('Expected to fail');
        })).catch(err => {
            if (err.message.indexOf('TIMEDOUT') > -1)
                callback();
            else
                callback('Time out error expected');
        });
    });
});