require('./_globalHooks');

var httpConfig = require('./support/httpConfig');
var eventstore = require('../index.js');
var assert = require('assert');
var uuid = require('uuid');

describe('Http Client - Delete stream', () => {
    it('Should return successful on stream delete', () => {
        var client = eventstore.http(httpConfig);

        var testStream = `TestStream-${uuid.v4()}`;
        return client.writeEvent(testStream, 'TestEventType', {
            something: '123'
        }).then(() => client.deleteStream(testStream).then(() => client.checkStreamExists(testStream).then(exists => {
            assert.equal(false, exists);
        })).catch(err => {
            assert.fail(err.message);
        }));
    });

    it('Should return successful on writing to a stream that has been soft deleted', () => {
        var client = eventstore.http(httpConfig);

        var testStream = `TestStream-${uuid.v4()}`;

        return client.writeEvent(testStream, 'TestEventType', {
            something: '123'
        }).then(() => client.deleteStream(testStream).then(() => client.writeEvent(testStream, 'TestEventType', {
            something: '456'
        })).catch(err => {
            assert.fail(err.message);
        }));
    });

    it('Should return successful on stream delete hard delete', callback => {
        var client = eventstore.http(httpConfig);

        var testStream = `TestStream-${uuid.v4()}`;
        client.writeEvent(testStream, 'TestEventType', {
            something: '123'
        }).then(() => client.deleteStream(testStream, true).then(() => client.checkStreamExists(testStream).then(() => {
            callback('Should not have returned resolved promise');
        }).catch(err => {
            assert(err.message.indexOf('410') > -1, 'Expected http 410');
            callback();
        })).catch(callback)).catch(callback);
    });

    it('Should fail when a stream does not exist', () => {
        var client = eventstore.http(httpConfig);

        var testStream = `TestStream-${uuid.v4()}`;

        return client.deleteStream(testStream).then(() => {
            assert.fail('Should have failed because stream does not exist');
        }).catch(err => {
            assert(err);
        });
    });

    it('Should return HTTP 410 when a writing to a stream that has been hard deleted', () => {
        var client = eventstore.http(httpConfig);

        var testStream = `TestStream-${uuid.v4()}`;

        return client.writeEvent(testStream, 'TestEventType', {
            something: '123'
        }).then(() => client.deleteStream(testStream, true).then(() => client.writeEvent(testStream, 'TestEventType', {
            something: '456'
        }).then(() => {
            assert.fail('Should have failed because stream does not exist');
        })).catch(err => {
            assert.equal(410, err.statusCode);
        }));
    });
});