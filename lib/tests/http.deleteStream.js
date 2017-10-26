import './_globalHooks';

import httpConfig from './support/httpConfig';
import eventstore from '../index';
import Promise from 'bluebird';
import assert from 'assert';
import uuid from 'uuid';

describe('Http Client - Delete stream', () => {
    it('Should return successful on stream delete', async() => {
        const client = eventstore.http(httpConfig);
        const testStream = `TestStream-${uuid.v4()}`;

        await client.writeEvent(testStream, 'TestEventType', {
            something: '123'
        });
        await client.deleteStream(testStream);

        assert.equal(await client.checkStreamExists(testStream), false);
    });

    it('Should return successful on projected stream delete', async() => {
        const client = eventstore.http(httpConfig);
        const testStream = `TestDeletedStream-${uuid.v4()}`;

        await client.writeEvent(testStream, 'TestEventType', {
            something: '123'
        });
        await Promise.delay(150);
        await client.deleteStream(`$ce-TestDeletedStream`);

        assert.equal(await client.checkStreamExists(`$ce-TestDeletedStream`), false);
    });

    it('Should return successful on writing to a stream that has been soft deleted', async() => {
        const client = eventstore.http(httpConfig);
        const testStream = `TestStream-${uuid.v4()}`;

        await client.writeEvent(testStream, 'TestEventType', {
            something: '123'
        });
        await client.deleteStream(testStream);
        return client.writeEvent(testStream, 'TestEventType', {
            something: '456'
        });
    });

    it('Should return successful on stream delete hard delete', async() => {
        const client = eventstore.http(httpConfig);
        const testStream = `TestStream-${uuid.v4()}`;

        await client.writeEvent(testStream, 'TestEventType', {
            something: '123'
        });
        await client.deleteStream(testStream, true);
        try {
            await client.checkStreamExists(testStream);
            throw new Error('Should not have returned resolved promise');
        } catch (err) {
            assert(err.message.includes('410'), 'Expected http 410');
        };
    });

    it('Should fail when a stream does not exist', async() => {
        const client = eventstore.http(httpConfig);
        const testStream = `TestStream-${uuid.v4()}`;

        try {
            await client.deleteStream(testStream);
            throw new Error('Should not have deleted stream that does not exist');
        } catch (err) {
            assert(err.message.includes('Stream does not exist'));
        }
    });

    it('Should return HTTP 410 when a writing to a stream that has been hard deleted', async() => {
        const client = eventstore.http(httpConfig);
        const testStream = `TestStream-${uuid.v4()}`;

        await client.writeEvent(testStream, 'TestEventType', {
            something: '123'
        });
        await client.deleteStream(testStream, true);
        try {
            await client.writeEvent(testStream, 'TestEventType', {
                something: '456'
            });
            throw new Error('Should have failed because stream does not exist');
        } catch (err) {
            assert.equal(410, err.statusCode);
        };
    });
});