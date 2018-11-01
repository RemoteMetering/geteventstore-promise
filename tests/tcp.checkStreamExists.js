import './_globalHooks';

import tcpConfig from './support/tcpConfig';
import EventStore from '../lib';
import assert from 'assert';
import uuid from 'uuid';

describe('TCP Client - Check Stream Exist', () => {
	it('Should return true when a stream exists', async function() {
		this.timeout(5000);
		const client = new EventStore.TCPClient(tcpConfig);

		const testStream = `TestStream-${uuid.v4()}`;
		await client.writeEvent(testStream, 'TestEventType', {
			something: '123'
		});
		assert.equal(await client.checkStreamExists(testStream), true);
	});

	it('Should return false when a stream does not exist', async function() {
		this.timeout(5000);
		const client = new EventStore.TCPClient(tcpConfig);

		assert.equal(await client.checkStreamExists('Non_existentStream'), false);
	});
});