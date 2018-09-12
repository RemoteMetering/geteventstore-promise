import './_globalHooks';

import httpConfig from './support/httpConfig';
import eventstore from '../index';
import Promise from 'bluebird';
import assert from 'assert';
import uuid from 'uuid';

describe('Http Client - Delete stream', () => {
	it('Should return successful on stream delete', async () => {
		const client = eventstore.http(httpConfig);
		const testStream = `TestStream-${uuid.v4()}`;

		await client.writeEvent(testStream, 'TestEventType', {
			something: '123'
		});
		await client.deleteStream(testStream);

		assert.equal(await client.checkStreamExists(testStream), false);
	});

	it('Should return successful on projected stream delete', async () => {
		const client = eventstore.http(httpConfig);
		const testStream = `TestDeletedStream-${uuid.v4()}`;

		await client.writeEvent(testStream, 'TestEventType', {
			something: '123'
		});
		await Promise.delay(150);
		await client.deleteStream(`$ce-TestDeletedStream`);

		assert.equal(await client.checkStreamExists(`$ce-TestDeletedStream`), false);
	});

	it('Should return successful on writing to a stream that has been soft deleted', async () => {
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

	it('Should return successful on stream delete hard delete', callback => {
		const client = eventstore.http(httpConfig);
		const testStream = `TestStream-${uuid.v4()}`;

		client.writeEvent(testStream, 'TestEventType', {
			something: '123'
		}).then(() => client.deleteStream(testStream, true).then(() => client.checkStreamExists(testStream).then(() => {
			callback('Should not have returned resolved promise');
		}).catch(err => {
			assert(err.message.includes('410'), 'Expected http 410');
			callback();
		})).catch(callback)).catch(callback);
	});

	it('Should fail when a stream does not exist', () => {
		const client = eventstore.http(httpConfig);
		const testStream = `TestStream-${uuid.v4()}`;

		return client.deleteStream(testStream).then(() => {
			assert.fail('Should have failed because stream does not exist');
		}).catch(err => {
			assert(err);
		});
	});

	it('Should return HTTP 410 when a writing to a stream that has been hard deleted', () => {
		const client = eventstore.http(httpConfig);
		const testStream = `TestStream-${uuid.v4()}`;

		return client.writeEvent(testStream, 'TestEventType', {
			something: '123'
		}).then(() => client.deleteStream(testStream, true).then(() => client.writeEvent(testStream, 'TestEventType', {
			something: '456'
		}).then(() => {
			assert.fail('Should have failed because stream does not exist');
		})).catch(err => {
			assert.equal(410, err.response.status);
		}));
	});
});