require('./_globalHooks');

const tcpConfig = require('./support/tcpConfig');
const eventstore = require('../index.js');
const Promise = require('bluebird');
const assert = require('assert');
const uuid = require('uuid');

describe('Tcp Client - Delete stream', () => {
    it('Should return successful on stream delete', () => {
        const client = eventstore.tcp(tcpConfig);

        const testStream = `TestStream-${uuid.v4()}`;
        return client.writeEvent(testStream, 'TestEventType', {
            something: '123'
        }).then(() => client.deleteStream(testStream).then(() => client.checkStreamExists(testStream).then(exists => {
            assert.equal(false, exists);
        })).catch(err => {
            assert.fail(err.message);
        }));
    });

    it('Should return successful on projected stream delete', () => {
        const client = eventstore.tcp(tcpConfig);

        const testStream = `TestDeletedStream-${uuid.v4()}`;
        return client.writeEvent(testStream, 'TestEventType', {
                something: '123'
            })
            .then(() => Promise.delay(150))
            .then(() => client.deleteStream(`$ce-TestDeletedStream`))
            .then(() => client.checkStreamExists(`$ce-TestDeletedStream`).then(exists => {
                assert.equal(false, exists);
            })).catch(err => {
                assert.fail(err.message);
            });
    });

    it('Should return successful on writing to a stream that has been soft deleted', () => {
        const client = eventstore.tcp(tcpConfig);

        const testStream = `TestStream-${uuid.v4()}`;

        return client.writeEvent(testStream, 'TestEventType', {
            something: '123'
        }).then(() => client.deleteStream(testStream).then(() => client.writeEvent(testStream, 'TestEventType', {
            something: '456'
        })).catch(err => {
            assert.fail(err.message);
        }));
    });

    it('Should return successful on stream delete hard delete', callback => {
        const client = eventstore.tcp(tcpConfig);

        const testStream = `TestStream-${uuid.v4()}`;
        client.writeEvent(testStream, 'TestEventType', {
            something: '123'
        }).then(() => client.deleteStream(testStream, true)
            .then(() => client.checkStreamExists(testStream))
            .then(() => {
                callback('Should not have returned resolved promise');
            }).catch(err => {
                assert(err.message.includes('hard deleted'), 'Expected "hard deleted"');
                callback();
            }).catch(callback)).catch(callback);
    });

    it('Should fail when a stream does not exist', () => {
        const client = eventstore.tcp(tcpConfig);

        const testStream = `TestStream-${uuid.v4()}`;

        return client.deleteStream(testStream).then(() => {
            assert.fail('Should have failed because stream does not exist');
        }).catch(err => {
            assert(err);
        });
    });

    it('Should return "StreamDeletedError" when a writing to a stream that has been hard deleted', () => {
        const client = eventstore.tcp(tcpConfig);

        const testStream = `TestStream-${uuid.v4()}`;

        return client.writeEvent(testStream, 'TestEventType', {
            something: '123'
        }).then(() => client.deleteStream(testStream, true).then(() => client.writeEvent(testStream, 'TestEventType', {
            something: '456'
        }).then(() => {
            assert.fail('Should have failed because stream does not exist');
        })).catch(err => {
            assert.equal('StreamDeletedError', err.name);
        }));
    });
});