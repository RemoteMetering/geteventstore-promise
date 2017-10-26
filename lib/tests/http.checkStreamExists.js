import './_globalHooks';

import httpConfig from './support/httpConfig';
import eventstore from '../index';
import assert from 'assert';
import uuid from 'uuid';
import _ from 'lodash';

describe('Http Client - Check Stream Exist', () => {
    it('Should return true when a stream exist', function() {
        this.timeout(10 * 1000);
        const client = eventstore.http(httpConfig);

        const testStream = `TestStream-${uuid.v4()}`;
        return client.writeEvent(testStream, 'TestEventType', {
            something: '123'
        }).then(() => client.checkStreamExists(testStream).then(exists => {
            assert.equal(exists, true);
        }));
    });

    it('Should return false when a stream does not exist', () => {
        const client = eventstore.http(httpConfig);

        return client.checkStreamExists('Non_existentStream').then(exists => {
            assert.equal(exists, false);
        });
    });

    it('Should return rejected promise when the request error is anything other than a 404', callback => {
        const config = _.cloneDeep(httpConfig);
        config.port = 1;
        const client = eventstore.http(config);

        client.checkStreamExists('Non_existentStream_wrong_port_config').then(() => {
            callback('Should not have returned successful promise');
        }).catch(err => {
            assert(err, 'No error received');
            assert(err.message.includes('ECONNREFUSED'), 'Connection refused error expected');
            callback();
        });
    });

    it('Should throw an exception when timeout is reached', callback => {
        const clonedConfig = _.cloneDeep(httpConfig);
        clonedConfig.timeout = 1;

        const client = eventstore.http(clonedConfig);
        const testStream = `TestStream-${uuid.v4()}`;
        client.writeEvent(testStream, 'TestEventType', {
            something: '123'
        }).then(() => client.checkStreamExists(testStream).then(() => {
            callback('Expected to fail');
        })).catch(err => {
            if (err.message.includes('TIMEDOUT'))
                callback();
            else
                callback('Time out error expected');
        });
    });
});