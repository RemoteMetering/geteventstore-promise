import './_globalHooks';

import httpConfig from './support/httpConfig';
import eventstore from '../index';
import assert from 'assert';
import uuid from 'uuid';

describe('Http Client - Write Event', () => {
    it('Write to a new stream and read the event', () => {
        const client = eventstore.http(httpConfig);

        const testStream = `TestStream-${uuid.v4()}`;
        return client.writeEvent(testStream, 'TestEventType', {
            something: '123'
        }).then(() => client.getEvents(testStream).then(events => {
            assert.equal(events[0].data.something, '123');
        }));
    });

    it('Should fail promise if no event data provided', () => {
        const client = eventstore.http(httpConfig);

        const testStream = `TestStream-${uuid.v4()}`;
        return client.writeEvent(testStream, 'TestEventType').then(() => {
            assert.fail('write should not have succeeded');
        }).catch(err => {
            assert(err, 'error should have been returned');
        });
    });
});