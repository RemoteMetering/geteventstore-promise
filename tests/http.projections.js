import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import KurrentDB from '../lib/index.js';
import generateEventId from '../lib/utilities/generateEventId.js';
import getHttpConfig from './support/getHttpConfig.js';
import waitUntil from './utilities/waitUntil.js';
import { runningV21 } from './support/v21.js';

const dirname = path.dirname(fileURLToPath(import.meta.url));

describe('Projections', () => {
  describe('Default Settings', () => {
    const assertionProjection = generateEventId();
    const assertionProjectionContent = fs.readFileSync(`${dirname}/support/testProjection.js`, {
      encoding: 'utf8'
    });

    it('Should create continuous projection', async function () {
      this.timeout(10 * 1000);
      const client = new KurrentDB.HTTPClient(getHttpConfig());

      const response = await client.projections.assert(assertionProjection, assertionProjectionContent);
      assert.equal(response.name, assertionProjection);

      const responseWithTrackEmittedStreamsEnabled = await client.projections.getInfo(assertionProjection, true);
      assert.equal(responseWithTrackEmittedStreamsEnabled.config.emitEnabled, false);
      assert.equal(responseWithTrackEmittedStreamsEnabled.config.trackEmittedStreams, false);
    });

    it('Should update existing projection', async function () {
      this.timeout(10 * 1000);
      const client = new KurrentDB.HTTPClient(getHttpConfig());

      const response = await client.projections.assert(assertionProjection, assertionProjectionContent);
      assert.equal(response.name, assertionProjection);
    });

    it('Should stop projection', async function () {
      this.timeout(10 * 1000);
      const client = new KurrentDB.HTTPClient(getHttpConfig());

      const response = await client.projections.stop(assertionProjection);
      assert.equal(response.name, assertionProjection);
      const projectionInfo = await client.projections.getInfo(assertionProjection);
      assert.equal(projectionInfo.status, 'Stopped');
    });

    it('Should start projection', async function () {
      this.timeout(10 * 1000);
      const client = new KurrentDB.HTTPClient(getHttpConfig());

      const response = await client.projections.start(assertionProjection);
      assert.equal(response.name, assertionProjection);
      const projectionInfo = await client.projections.getInfo(assertionProjection);
      assert.equal(projectionInfo.status, 'Running');
    });

    it('Should reset projection', async function () {
      this.timeout(10 * 1000);
      const client = new KurrentDB.HTTPClient(getHttpConfig());

      const response = await client.projections.reset(assertionProjection);
      assert.equal(response.name, assertionProjection);
      const projectionInfo = await client.projections.getInfo(assertionProjection);
      assert(
        ['Preparing/Stopped', 'Running'].includes(projectionInfo.status),
        `Invalid status after reset: ${projectionInfo.status}`
      );
    });

    it('Should remove continuous projection', async function () {
      this.timeout(10 * 1000);
      const client = new KurrentDB.HTTPClient(getHttpConfig());

      const stopResponse = await client.projections.stop(assertionProjection);
      await waitUntil(async () => (await client.projections.getInfo(assertionProjection)).status === 'Stopped');

      assert.equal(stopResponse.name, assertionProjection);
      const removeResponse = await client.projections.remove(assertionProjection);
      assert.equal(removeResponse.name, assertionProjection);
    });
  });

  describe('Custom Settings', () => {
    const assertionProjection = generateEventId();
    const assertionProjectionContent = fs.readFileSync(`${dirname}/support/testProjection.js`, {
      encoding: 'utf8'
    });

    it('Should create one-time projection with all settings enabled', async function () {
      this.timeout(10 * 1000);
      const client = new KurrentDB.HTTPClient(getHttpConfig());

      const response = await client.projections.assert(
        assertionProjection,
        assertionProjectionContent,
        'onetime',
        true,
        true,
        true,
        true
      );
      assert.equal(response.name, assertionProjection);
      let responseWithTrackEmittedStreamsEnabled;
      await waitUntil(async () => {
        responseWithTrackEmittedStreamsEnabled = await client.projections.getInfo(assertionProjection, true);
        return (
          responseWithTrackEmittedStreamsEnabled.config.trackEmittedStreams === true &&
          responseWithTrackEmittedStreamsEnabled.config.emitEnabled === true
        );
      });
      assert.equal(responseWithTrackEmittedStreamsEnabled.config.trackEmittedStreams, true);
      assert.equal(responseWithTrackEmittedStreamsEnabled.config.emitEnabled, true);
    });

    it('Should get config for continuous projection', async function () {
      this.timeout(10 * 1000);
      const client = new KurrentDB.HTTPClient(getHttpConfig());

      const projectionConfig = await client.projections.config(assertionProjection);

      assert.equal(projectionConfig.emitEnabled, true);
      assert.equal(projectionConfig.trackEmittedStreams, true);
      assert.equal(projectionConfig.checkpointHandledThreshold, 4000);
      assert.equal(projectionConfig.checkpointUnhandledBytesThreshold, 10000000);
      assert.equal(projectionConfig.pendingEventsThreshold, 5000);
      assert.equal(projectionConfig.maxWriteBatchLength, 500);
      if (!runningV21) assert.equal(projectionConfig.label, 'Projections');
    });

    it('Should remove one-time projection', async function () {
      this.timeout(10 * 1000);
      const client = new KurrentDB.HTTPClient(getHttpConfig());

      const stopResponse = await client.projections.stop(assertionProjection);
      assert.equal(stopResponse.name, assertionProjection);
      const removeResponse = await client.projections.remove(assertionProjection);
      assert.equal(removeResponse.name, assertionProjection);
    });

    it('Should create one-time projection with emits enabled but trackEmittedStreams disabled then remove it', async function () {
      this.timeout(10 * 1000);
      const client = new KurrentDB.HTTPClient(getHttpConfig());

      const response = await client.projections.assert(
        assertionProjection,
        assertionProjectionContent,
        'onetime',
        true,
        true,
        true
      );
      assert.equal(response.name, assertionProjection);
      let responseWithTrackEmittedStreamsEnabled;
      await waitUntil(async () => {
        responseWithTrackEmittedStreamsEnabled = await client.projections.getInfo(assertionProjection, true);
        return (
          responseWithTrackEmittedStreamsEnabled.config.trackEmittedStreams === false &&
          responseWithTrackEmittedStreamsEnabled.config.emitEnabled === true
        );
      });
      assert.equal(responseWithTrackEmittedStreamsEnabled.config.trackEmittedStreams, false);
      assert.equal(responseWithTrackEmittedStreamsEnabled.config.emitEnabled, true);

      const stopResponse = await client.projections.stop(assertionProjection);
      assert.equal(stopResponse.name, assertionProjection);
      const removeResponse = await client.projections.remove(assertionProjection);
      assert.equal(removeResponse.name, assertionProjection);
    });
  });

  describe('Global Projections Operations', () => {
    it('Should enable all projections', async function () {
      this.timeout(10 * 1000);
      const client = new KurrentDB.HTTPClient(getHttpConfig());

      await client.projections.enableAll();

      let projectionsInfo;
      await waitUntil(async () => {
        projectionsInfo = await client.projections.getAllProjectionsInfo();
        return projectionsInfo.projections.every((projection) => projection.status.toLowerCase().includes('running'));
      });
      projectionsInfo.projections.forEach((projection) => {
        assert.equal(projection.status.toLowerCase().includes('running'), true);
      });
    });

    it('Should disable all projections', async function () {
      this.timeout(1000 * 10);
      const client = new KurrentDB.HTTPClient(getHttpConfig());

      await client.projections.disableAll();

      let projectionsInfo;
      await waitUntil(async () => {
        projectionsInfo = await client.projections.getAllProjectionsInfo();
        return projectionsInfo.projections.every((projection) => projection.status.toLowerCase().includes('stopped'));
      });
      projectionsInfo.projections.forEach((projection) => {
        assert.equal(projection.status.toLowerCase().includes('stopped'), true);
      });
    });
  });

  describe('General', () => {
    it('Should return all eventstore projections information', async function () {
      this.timeout(10 * 1000);
      const client = new KurrentDB.HTTPClient(getHttpConfig());

      const projectionsInfo = await client.projections.getAllProjectionsInfo();
      assert.notEqual(projectionsInfo, undefined);
      assert(projectionsInfo.projections.length > 0);
    });

    it('Should return state for test projection', async function () {
      this.timeout(10 * 1000);
      const client = new KurrentDB.HTTPClient(getHttpConfig());

      const projectionName = 'TestProjection';
      const projectionContent = fs.readFileSync(`${dirname}/support/testProjection.js`, {
        encoding: 'utf8'
      });

      await client.projections.assert(projectionName, projectionContent);
      await waitUntil(async () => {
        try {
          return (await client.projections.getInfo(projectionName)).status.toLowerCase().includes('running');
        } catch {
          return false;
        }
      });

      const testStream = `TestProjectionStream-${generateEventId()}`;
      await client.writeEvent(testStream, 'TestProjectionEventType', {
        something: '123'
      });

      let projectionState;
      await waitUntil(async () => {
        try {
          projectionState = await client.projections.getState(projectionName);
          return projectionState.data && projectionState.data.something === '123';
        } catch {
          return false;
        }
      });
      assert.equal(projectionState.data.something, '123');

      const stopResponse = await client.projections.stop(projectionName);
      assert.equal(stopResponse.name, projectionName);
      const removeResponse = await client.projections.remove(projectionName);
      assert.equal(removeResponse.name, projectionName);
    });

    it('Should return state for partitioned test projection', async function () {
      this.timeout(1000 * 10);
      const client = new KurrentDB.HTTPClient(getHttpConfig());

      const projectionName = `TestProjection${generateEventId()}`;
      const projectionContent = fs.readFileSync(`${dirname}/support/testPartitionedProjection.js`, {
        encoding: 'utf8'
      });

      await client.projections.assert(projectionName, projectionContent);
      await waitUntil(async () => {
        try {
          return (await client.projections.getInfo(projectionName)).status.toLowerCase().includes('running');
        } catch {
          return false;
        }
      });

      const testStream = `TestProjectionStream-${generateEventId()}`;
      await client.writeEvent(testStream, 'TestProjectionEventType', {
        something: '123'
      });

      const options = {
        partition: testStream
      };

      let projectionState;
      await waitUntil(
        async () => {
          try {
            projectionState = await client.projections.getState(projectionName, options);
            return projectionState.data && projectionState.data.something === '123';
          } catch {
            return false;
          }
        },
        { timeout: 8000 }
      );
      assert.equal(projectionState.data.something, '123');

      const stopResponse = await client.projections.stop(projectionName);
      assert.equal(stopResponse.name, projectionName);
      const removeResponse = await client.projections.remove(projectionName);
      assert.equal(removeResponse.name, projectionName);
    });

    it('Should return 404 for non-existent projection when requesting state', async function () {
      this.timeout(10 * 1000);
      const client = new KurrentDB.HTTPClient(getHttpConfig());
      try {
        await client.projections.getState('SomeProjectionNameThatDoesNotExist');
      } catch (err) {
        assert.equal(err.response.status, 404, 'Should have received 404');
        return;
      }
      assert.fail('Should have received 404 for non-existent projection');
    });

    it('Should return result for test projection', async function () {
      this.timeout(10 * 1000);
      const client = new KurrentDB.HTTPClient(getHttpConfig());

      const projectionName = 'TestProjection';
      const projectionContent = fs.readFileSync(`${dirname}/support/testProjection.js`, {
        encoding: 'utf8'
      });

      await client.projections.assert(projectionName, projectionContent);
      await waitUntil(async () => {
        try {
          return (await client.projections.getInfo(projectionName)).status.toLowerCase().includes('running');
        } catch {
          return false;
        }
      });

      const testStream = `TestProjectionStream-${generateEventId()}`;
      await client.writeEvent(testStream, 'TestProjectionEventType', {
        something: '123'
      });

      let projectionState;
      await waitUntil(async () => {
        try {
          projectionState = await client.projections.getResult(projectionName);
          return String(projectionState.data) === '321';
        } catch {
          return false;
        }
      });
      assert.equal(projectionState.data, '321');

      const stopResponse = await client.projections.stop(projectionName);
      assert.equal(stopResponse.name, projectionName);
      const removeResponse = await client.projections.remove(projectionName);
      assert.equal(removeResponse.name, projectionName);
    });

    it('Should return result for partitioned test projection', async function () {
      this.timeout(1000 * 10);
      const client = new KurrentDB.HTTPClient(getHttpConfig());

      const projectionName = `TestProjection${generateEventId()}`;
      const projectionContent = fs.readFileSync(`${dirname}/support/testPartitionedProjection.js`, {
        encoding: 'utf8'
      });

      await client.projections.assert(projectionName, projectionContent);
      await waitUntil(async () => {
        try {
          return (await client.projections.getInfo(projectionName)).status.toLowerCase().includes('running');
        } catch {
          return false;
        }
      });

      const testStream = `TestProjectionStream-${generateEventId()}`;
      await client.writeEvent(testStream, 'TestProjectionEventType', {
        something: '123'
      });

      const options = {
        partition: testStream
      };

      let projectionState;
      await waitUntil(
        async () => {
          try {
            projectionState = await client.projections.getResult(projectionName, options);
            return String(projectionState.data) === '321';
          } catch {
            return false;
          }
        },
        { timeout: 8000 }
      );
      assert.equal(projectionState.data, '321');

      const stopResponse = await client.projections.stop(projectionName);
      assert.equal(stopResponse.name, projectionName);
      const removeResponse = await client.projections.remove(projectionName);
      assert.equal(removeResponse.name, projectionName);
    });

    it('Should return 404 for non-existent projection when requesting result', async function () {
      this.timeout(10 * 1000);
      const client = new KurrentDB.HTTPClient(getHttpConfig());
      try {
        await client.projections.getResult('SomeProjectionNameThatDoesNotExist');
      } catch (err) {
        assert.equal(err.response.status, 404, 'Should have received 404');
        return;
      }
      assert.fail('Should have received 404 for non-existent projection');
    });
  });
});
