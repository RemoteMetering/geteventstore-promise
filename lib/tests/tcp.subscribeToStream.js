import './_globalHooks';

import tcpConfig from './support/tcpConfig';
import eventstore from '../index';
import Promise from 'bluebird';
import assert from 'assert';
import uuid from 'uuid';

describe('TCP Client - Subscribe To Stream', () => {
	it('Should get all events written to a subscription stream after subscription is started', function (done) {
		this.timeout(15 * 1000);
		const client = eventstore.tcp(tcpConfig);
		const testStream = `TestStream-${uuid.v4()}`;
		let processedEventCount = 0;
		let hasPassed = false;

		function onEventAppeared() {
			processedEventCount++;
		}

		function onDropped() {
			if (!hasPassed) done('should not drop');
		}

		const initialEvents = [];

		for (let k = 0; k < 10; k++) {
			initialEvents.push(eventstore.eventFactory.NewEvent('TestEventType', {
				id: k
			}));
		}

		client.writeEvents(testStream, initialEvents).then(() => {
			client.subscribeToStream(testStream, onEventAppeared, onDropped, false).then(subscription => Promise.delay(3000).then(() => {
				assert.equal(10, processedEventCount, 'expect processed events to be 10');
				assert(subscription, 'Subscription Expected');
				hasPassed = true;
				done();
				client.close();
			}));
			const events = [];
			for (let k = 0; k < 10; k++) {
				events.push(eventstore.eventFactory.NewEvent('TestEventType', {
					id: k
				}));
			}
			return Promise.delay(100).then(() => client.writeEvents(testStream, events));
		}).catch(done);
	});
});