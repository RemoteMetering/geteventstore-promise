import './_globalHooks';

import generateEventId from '../lib/utilities/generateEventId';
import getGRPCConfig from './support/getGRPCConfig';
import sleep from './utilities/sleep';
import EventStore from '../lib';
import assert from 'assert';

describe('gRPC Client - Delete stream', () => {
	it('Should return successful on stream delete', () => {
		const client = new EventStore.GRPCClient(getGRPCConfig());

		const testStream = `TestStream-${generateEventId()}`;
		return client.writeEvent(testStream, 'TestEventType', {
			something: '123'
		}).then(() => client.deleteStream(testStream).then(() => client.checkStreamExists(testStream).then(exists => {
			assert.equal(false, exists);
		})).catch(err => {
			assert.fail(err.message);
		})).finally(() => client.close());
	});

	it('Should return successful on projected stream delete', async () => {
		const client = new EventStore.GRPCClient(getGRPCConfig());

		const testStream = `TestDeletedStream-${generateEventId()}`;
		await client.writeEvent(testStream, 'TestEventType', {
			something: '123'
		});

		await sleep(150);
		await client.deleteStream(`$ce-TestDeletedStream`);
		assert.equal(await client.checkStreamExists(`$ce-TestDeletedStream`), false);

		await client.close();
	});

	it('Should return successful on writing to a stream that has been soft deleted', () => {
		const client = new EventStore.GRPCClient(getGRPCConfig());

		const testStream = `TestStream-${generateEventId()}`;

		return client.writeEvent(testStream, 'TestEventType', {
			something: '123'
		}).then(() => client.deleteStream(testStream).then(() => client.writeEvent(testStream, 'TestEventType', {
			something: '456'
		})).catch(err => {
			assert.fail(err.message);
		})).finally(() => client.close());
	});

	it('Should return successful on stream delete hard delete', callback => {
		const client = new EventStore.GRPCClient(getGRPCConfig());

		const testStream = `TestStream-${generateEventId()}`;
		client.writeEvent(testStream, 'TestEventType', {
			something: '123'
		}).then(() => client.deleteStream(testStream, true)
			.then(() => client.checkStreamExists(testStream))
			.then(() => {
				callback('Should not have returned resolved promise');
			}).catch(err => {
				assert.equal(err.type, 'stream-deleted');
				callback();
			}).catch(callback)).catch(callback).finally(() => client.close());
	});

	it('Should fail when a stream does not exist', () => {
		const client = new EventStore.GRPCClient(getGRPCConfig());

		const testStream = `TestStream-${generateEventId()}`;

		return client.deleteStream(testStream).then(() => {
			assert.fail('Should have failed because stream does not exist');
		}).catch(err => {
			assert(err);
		}).finally(() => client.close());
	});

	it('Should return "StreamDeletedError" when a writing to a stream that has been hard deleted', () => {
		const client = new EventStore.GRPCClient(getGRPCConfig());

		const testStream = `TestStream-${generateEventId()}`;

		return client.writeEvent(testStream, 'TestEventType', {
			something: '123'
		}).then(() => client.deleteStream(testStream, true).then(() => client.writeEvent(testStream, 'TestEventType', {
			something: '456'
		}).then(() => {
			assert.fail('Should have failed because stream does not exist');
		})).catch(err => {
			assert.equal(err.type, 'stream-deleted');
		})).finally(() => client.close());
	});
});