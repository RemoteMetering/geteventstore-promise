import './_globalHooks';

import tcpConfig from './support/tcpConfig';
import assert from 'assert';
import eventstore from '../index';
import uuid from 'uuid';

describe('TCP Client - Test Connection', () => {
    it('Should connect and write event on correct connection properties', () => {
        const client = eventstore.tcp(tcpConfig);
        const testStream = `TestStream-${uuid.v4()}`;
        return client.writeEvent(testStream, 'TestEventType', {
            something: '123'
        });
    });

    it('Should not connect on incorrect hostname', function() {
        this.timeout(60 * 1000);
        const config = JSON.parse(JSON.stringify(tcpConfig));
        config.hostname = 'MadeToFailHostName';

        const client = eventstore.tcp(config);

        const testStream = `TestStream-${uuid.v4()}`;
        return client.writeEvent(testStream, 'TestEventType', {
            something: '123'
        }).then(() => {
            assert.fail('Should not have written event successfully');
        }).catch(err => {
            assert(err.message);
        });
    });

    it('Should not connect on incorrect port', function() {
        this.timeout(60 * 1000);
        const config = JSON.parse(JSON.stringify(tcpConfig));
        config.port = 9999;

        const client = eventstore.tcp(config);

        const testStream = `TestStream-${uuid.v4()}`;
        return client.writeEvent(testStream, 'TestEventType', {
            something: '123'
        }).then(() => {
            assert.fail('Should not have written event successfully');
        }).catch(err => {
            assert(err.message);
        });
    });

    it('Should close all streams', function() {
        this.timeout(60 * 1000);
        const config = JSON.parse(JSON.stringify(tcpConfig));
        const client = eventstore.tcp(config);

        const testStream = `TestStream-${uuid.v4()}`;
        return client.writeEvent(testStream, 'TestEventType', {
            something: '123'
        }).then(() => client.closeConnections().then(() => client.getConnections().then(connections => {
            assert(connections);
            assert.equal(0, connections.length);
        })));
    });
});