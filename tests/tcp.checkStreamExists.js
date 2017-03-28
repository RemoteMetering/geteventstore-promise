require('./_globalHooks');

const tcpConfig = require('./support/tcpConfig');
const eventstore = require('../index.js');
const assert = require('assert');
const uuid = require('uuid');

describe('TCP Client - Check Stream Exist', () => {
    it('Should return true when a stream exist', function() {
        this.timeout(5000);
        const client = eventstore.tcp(tcpConfig);

        const testStream = `TestStream-${uuid.v4()}`;
        return client.writeEvent(testStream, 'TestEventType', {
            something: '123'
        }).then(() => client.checkStreamExists(testStream).then(exists => {
            assert.equal(true, exists);
        }));
    });

    it('Should return false when a stream does not exist', function() {
        this.timeout(5000);
        const client = eventstore.tcp(tcpConfig);

        return client.checkStreamExists('Non_existentStream').then(exists => {
            assert.equal(false, exists);
        });
    });
});