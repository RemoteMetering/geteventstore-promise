import './_globalHooks';

import httpConfig from './support/httpConfig';
import eventstore from '../index';
import Promise from 'bluebird';
import assert from 'assert';
import uuid from 'uuid';
import _ from 'lodash';
import fs from 'fs';

describe('Projections', () => {
	describe('Default Settings', () => {
		const assertionProjection = uuid.v4();
		const assertionProjectionContent = fs.readFileSync(`${__dirname}/support/testProjection.js`, {
			encoding: 'utf8'
		});

		it('Should create continous projection', async function() {
			this.timeout(10 * 1000);
			const client = eventstore.http(httpConfig);

			const response = await client.projections.assert(assertionProjection, assertionProjectionContent);
			assert.equal(response.name, assertionProjection);
		});

		it('Should update existing projection', async function() {
			this.timeout(10 * 1000);
			const client = eventstore.http(httpConfig);

			const response = await client.projections.assert(assertionProjection, assertionProjectionContent);
			assert.equal(response.name, assertionProjection);
		});

		it('Should stop projection', async function() {
			this.timeout(10 * 1000);
			const client = eventstore.http(httpConfig);

			const response = await client.projections.stop(assertionProjection);
			assert.equal(response.name, assertionProjection);
			const projectionInfo = await client.projections.getInfo(assertionProjection);
			assert.equal(projectionInfo.status, 'Stopped');
		});

		it('Should start projection', async function() {
			this.timeout(10 * 1000);
			const client = eventstore.http(httpConfig);

			const response = await client.projections.start(assertionProjection);
			assert.equal(response.name, assertionProjection);
			const projectionInfo = await client.projections.getInfo(assertionProjection);
			assert.equal(projectionInfo.status, 'Running');
		});

		it('Should reset projection', async function() {
			this.timeout(10 * 1000);
			const client = eventstore.http(httpConfig);

			const response = await client.projections.reset(assertionProjection);
			assert.equal(response.name, assertionProjection);
			const projectionInfo = await client.projections.getInfo(assertionProjection);
			assert.equal(projectionInfo.status, 'Preparing/Stopped');
		});

		it('Should remove continous projection', async function() {
			this.timeout(10 * 1000);
			const client = eventstore.http(httpConfig);

			const stopResponse = await client.projections.stop(assertionProjection);
			await Promise.delay(1000);

			assert.equal(stopResponse.name, assertionProjection);
			const removeResponse = await client.projections.remove(assertionProjection);
			assert.equal(removeResponse.name, assertionProjection);
		});
	});

	describe('Custom Settings', () => {
		const assertionProjection = uuid.v4();
		const assertionProjectionContent = fs.readFileSync(`${__dirname}/support/testProjection.js`, {
			encoding: 'utf8'
		});

		it('Should create one-time projection with all settings enabled', async function() {
			this.timeout(10 * 1000);
			const client = eventstore.http(httpConfig);

			const response = await client.projections.assert(assertionProjection, assertionProjectionContent, 'onetime', true, true, true);
			await Promise.delay(2000);
			assert.equal(response.name, assertionProjection);
		});

		it('Should remove one-time projection', async function() {
			this.timeout(10 * 1000);
			const client = eventstore.http(httpConfig);

			const stopResponse = await client.projections.stop(assertionProjection);
			assert.equal(stopResponse.name, assertionProjection);
			const removeResponse = await client.projections.remove(assertionProjection);
			assert.equal(removeResponse.name, assertionProjection);
		});
	});

	describe('Global Projections Operations', () => {
		it('Should enable all projections', async function() {
			this.timeout(10 * 1000);
			const client = eventstore.http(httpConfig);

			await client.projections.enableAll();
			await Promise.delay(1000);

			const projectionsInfo = await client.projections.getAllProjectionsInfo();
			_.each(projectionsInfo.projections, projection => {
				assert.equal(projection.status.toLowerCase().includes('running'), true);
			});
		});

		it('Should disable all projections', async function() {
			this.timeout(1000 * 10);
			const client = eventstore.http(httpConfig);

			await client.projections.disableAll();
			await Promise.delay(1000);

			const projectionsInfo = await client.projections.getAllProjectionsInfo();
			_.each(projectionsInfo.projections, projection => {
				assert.equal(projection.status.toLowerCase().includes('stopped'), true);
			});
		});
	});

	describe('General', () => {
		it('Should return content with all eventstore projections information', async function() {
			this.timeout(10 * 1000);
			const client = eventstore.http(httpConfig);

			const projectionsInfo = await client.projections.getAllProjectionsInfo();
			assert.notEqual(projectionsInfo, undefined);
			assert(projectionsInfo.projections.length > 0);
		});

		it('Should return content for test projection state', async function() {
			this.timeout(10 * 1000);
			const client = eventstore.http(httpConfig);

			const projectionName = 'TestProjection';
			const projectionContent = fs.readFileSync(`${__dirname}/support/testProjection.js`, {
				encoding: 'utf8'
			});

			await client.projections.assert(projectionName, projectionContent);
			await Promise.delay(500);

			const testStream = `TestProjectionStream-${uuid.v4()}`;
			await client.writeEvent(testStream, 'TestProjectionEventType', {
				something: '123'
			});

			await Promise.delay(1000);
			const projectionState = await client.projections.getState(projectionName);
			assert.equal(projectionState.data.something, '123');

			const stopResponse = await client.projections.stop(projectionName);
			assert.equal(stopResponse.name, projectionName);
			const removeResponse = await client.projections.remove(projectionName);
			assert.equal(removeResponse.name, projectionName);
		});

		it('Should return content for test partioned projection', async function() {
			this.timeout(1000 * 10);
			const client = eventstore.http(httpConfig);

			const projectionName = `TestProjection${uuid.v4()}`;
			const projectionContent = fs.readFileSync(`${__dirname}/support/testPartionedProjection.js`, {
				encoding: 'utf8'
			});

			await client.projections.assert(projectionName, projectionContent);
			await Promise.delay(500);

			const testStream = `TestProjectionStream-${uuid.v4()}`;
			await client.writeEvent(testStream, 'TestProjectionEventType', {
				something: '123'
			});

			await Promise.delay(4000);
			const options = {
				partition: testStream
			};

			const projectionState = await client.projections.getState(projectionName, options);
			assert.equal(projectionState.data.something, '123');

			const stopResponse = await client.projections.stop(projectionName);
			assert.equal(stopResponse.name, projectionName);
			const removeResponse = await client.projections.remove(projectionName);
			assert.equal(removeResponse.name, projectionName);
		});

		it('Should return 404 for non-existant projection state', function() {
			this.timeout(10 * 1000);
			const client = eventstore.http(httpConfig);
			return client.projections.getState('SomeProjectionNameThatDoesNotExist').catch(err => assert(err.statusCode, 404));
		});
	});
});