import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import KurrentDB from '../lib/index.js';
import generateEventId from '../lib/utilities/generateEventId.js';
import getGRPCConfig from './support/getGRPCConfig.js';
import waitUntil from './utilities/waitUntil.js';

const dirname = path.dirname(fileURLToPath(import.meta.url));

describe('gRPC Client - Projections', () => {
  after(async function () {
    this.timeout(10 * 1000);
    const client = new KurrentDB.GRPCClient(getGRPCConfig());

    await client.projections.enableAll();
    await waitUntil(async () => {
      const projections = await client.projections.getAllProjectionsInfo();
      return projections.every((projection) => projection.status.toLowerCase().includes('running'));
    });

    await client.close();
  });

  describe('Default Settings', () => {
    const assertionProjection = generateEventId();
    const assertionProjectionContent = fs.readFileSync(`${dirname}/support/testProjection.js`, {
      encoding: 'utf8'
    });

    it('Should create continuous projection', async function () {
      this.timeout(10 * 1000);
      const client = new KurrentDB.GRPCClient(getGRPCConfig());

      await client.projections.assert(assertionProjection, assertionProjectionContent);

      const projectionInfo = await client.projections.getInfo(assertionProjection);
      assert.equal(projectionInfo.name, assertionProjection);

      await client.close();
    });

    it('Should update existing projection', async function () {
      this.timeout(10 * 1000);
      const client = new KurrentDB.GRPCClient(getGRPCConfig());

      await client.projections.assert(assertionProjection, assertionProjectionContent);

      const projectionInfo = await client.projections.getInfo(assertionProjection);
      assert.equal(projectionInfo.name, assertionProjection);

      await client.close();
    });

    it('Should stop projection', async function () {
      this.timeout(10 * 1000);
      const client = new KurrentDB.GRPCClient(getGRPCConfig());

      await client.projections.stop(assertionProjection);
      await waitUntil(async () => (await client.projections.getInfo(assertionProjection)).status === 'Stopped');

      const projectionInfo = await client.projections.getInfo(assertionProjection);
      assert.equal(projectionInfo.status, 'Stopped');

      await client.close();
    });

    it('Should start projection', async function () {
      this.timeout(10 * 1000);
      const client = new KurrentDB.GRPCClient(getGRPCConfig());

      await client.projections.start(assertionProjection);
      await waitUntil(async () => (await client.projections.getInfo(assertionProjection)).status === 'Running');

      const projectionInfo = await client.projections.getInfo(assertionProjection);
      assert.equal(projectionInfo.status, 'Running');

      await client.close();
    });

    it('Should reset projection', async function () {
      this.timeout(10 * 1000);
      const client = new KurrentDB.GRPCClient(getGRPCConfig());

      await client.projections.reset(assertionProjection);

      const projectionInfo = await client.projections.getInfo(assertionProjection);
      assert(
        ['Preparing/Stopped', 'Stopped', 'Running'].includes(projectionInfo.status),
        `Invalid status after reset: ${projectionInfo.status}`
      );

      await client.close();
    });

    it('Should remove continuous projection', async function () {
      this.timeout(10 * 1000);
      const client = new KurrentDB.GRPCClient(getGRPCConfig());

      await client.projections.stop(assertionProjection);
      await waitUntil(async () => (await client.projections.getInfo(assertionProjection)).status === 'Stopped');

      await client.projections.remove(assertionProjection);
      await waitUntil(async () => (await client.projections.getInfo(assertionProjection)) === undefined);

      assert.equal(await client.projections.getInfo(assertionProjection), undefined);

      await client.close();
    });
  });

  describe('Custom Settings', () => {
    const assertionProjectionContent = fs.readFileSync(`${dirname}/support/testProjection.js`, {
      encoding: 'utf8'
    });

    it('Should reject non-continuous projection modes', async function () {
      this.timeout(10 * 1000);
      const client = new KurrentDB.GRPCClient(getGRPCConfig());

      const assertionProjection = generateEventId();
      try {
        await client.projections.assert(assertionProjection, assertionProjectionContent, 'onetime');
      } catch (err) {
        assert(
          err.message.includes("Only 'continuous' projections are supported over gRPC"),
          `Unexpected error: ${err.message}`
        );
        await client.close();
        return;
      }

      await client.close();
      assert.fail('Should have rejected a non-continuous projection mode');
    });
  });

  describe('Global Projections Operations', () => {
    it('Should enable all projections', async function () {
      this.timeout(10 * 1000);
      const client = new KurrentDB.GRPCClient(getGRPCConfig());

      await client.projections.enableAll();

      let projections;
      await waitUntil(async () => {
        projections = await client.projections.getAllProjectionsInfo();
        return projections.every((projection) => projection.status.toLowerCase().includes('running'));
      });
      projections.forEach((projection) => {
        assert.equal(projection.status.toLowerCase().includes('running'), true);
      });

      await client.close();
    });

    it('Should disable all projections', async function () {
      this.timeout(10 * 1000);
      const client = new KurrentDB.GRPCClient(getGRPCConfig());

      await client.projections.disableAll();

      let projections;
      await waitUntil(async () => {
        projections = await client.projections.getAllProjectionsInfo();
        return projections.every((projection) => projection.status.toLowerCase().includes('stopped'));
      });
      projections.forEach((projection) => {
        assert.equal(projection.status.toLowerCase().includes('stopped'), true);
      });

      await client.close();
    });
  });

  describe('General', () => {
    const assertionProjectionContent = fs.readFileSync(`${dirname}/support/testProjection.js`, {
      encoding: 'utf8'
    });

    it('Should reject assert when name is not provided', async function () {
      this.timeout(10 * 1000);
      const client = new KurrentDB.GRPCClient(getGRPCConfig());

      await assert.rejects(() => client.projections.assert(undefined, assertionProjectionContent), /Name not provided/);

      await client.close();
    });

    it('Should reject assert when projection content is not provided', async function () {
      this.timeout(10 * 1000);
      const client = new KurrentDB.GRPCClient(getGRPCConfig());

      await assert.rejects(
        () => client.projections.assert(`AssertNoContent-${generateEventId()}`),
        /Projection Content not provided/
      );

      await client.close();
    });

    it('Should create a disabled projection when enabled is false', async function () {
      this.timeout(10 * 1000);
      const client = new KurrentDB.GRPCClient(getGRPCConfig());
      const projectionName = `DisabledProjection-${generateEventId()}`;

      await client.projections.assert(projectionName, assertionProjectionContent, 'continuous', false);
      await waitUntil(async () => (await client.projections.getInfo(projectionName)).status === 'Stopped');

      const projectionInfo = await client.projections.getInfo(projectionName);
      assert.equal(projectionInfo.status, 'Stopped');

      await client.projections.remove(projectionName);
      await client.close();
    });

    it('Should disable an existing projection when updated with enabled false', async function () {
      this.timeout(10 * 1000);
      const client = new KurrentDB.GRPCClient(getGRPCConfig());
      const projectionName = `UpdateDisableProjection-${generateEventId()}`;

      await client.projections.assert(projectionName, assertionProjectionContent);
      await waitUntil(async () =>
        (await client.projections.getInfo(projectionName)).status.toLowerCase().includes('running')
      );

      await client.projections.assert(projectionName, assertionProjectionContent, 'continuous', false);
      await waitUntil(async () => (await client.projections.getInfo(projectionName)).status === 'Stopped');

      const projectionInfo = await client.projections.getInfo(projectionName);
      assert.equal(projectionInfo.status, 'Stopped');

      await client.projections.remove(projectionName);
      await client.close();
    });

    it('Should create a projection with emit and track emitted streams enabled', async function () {
      this.timeout(10 * 1000);
      const client = new KurrentDB.GRPCClient(getGRPCConfig());
      const projectionName = `EmitProjection-${generateEventId()}`;

      await client.projections.assert(
        projectionName,
        assertionProjectionContent,
        'continuous',
        true,
        undefined,
        true,
        true
      );
      await waitUntil(async () =>
        (await client.projections.getInfo(projectionName)).status.toLowerCase().includes('running')
      );

      const projectionInfo = await client.projections.getInfo(projectionName);
      assert.equal(projectionInfo.name, projectionName);

      await client.projections.stop(projectionName);
      await waitUntil(async () => (await client.projections.getInfo(projectionName)).status === 'Stopped');
      await client.projections.remove(projectionName);
      await client.close();
    });

    it('Should return all eventstore projections information', async function () {
      this.timeout(10 * 1000);
      const client = new KurrentDB.GRPCClient(getGRPCConfig());

      const projections = await client.projections.getAllProjectionsInfo();
      assert.notEqual(projections, undefined);
      assert(Array.isArray(projections));
      assert(projections.length > 0);

      await client.close();
    });

    it('Should return state for test projection', async function () {
      this.timeout(10 * 1000);
      const client = new KurrentDB.GRPCClient(getGRPCConfig());

      const projectionName = `TestProjection${generateEventId()}`;
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

      await client.projections.stop(projectionName);
      await waitUntil(async () => (await client.projections.getInfo(projectionName)).status === 'Stopped');
      await client.projections.remove(projectionName);

      await client.close();
    });

    it('Should return state for partitioned test projection', async function () {
      this.timeout(10 * 1000);
      const client = new KurrentDB.GRPCClient(getGRPCConfig());

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

      await client.projections.stop(projectionName);
      await waitUntil(async () => (await client.projections.getInfo(projectionName)).status === 'Stopped');
      await client.projections.remove(projectionName);

      await client.close();
    });

    it('Should throw a not-found error for non-existent projection when requesting state', async function () {
      this.timeout(10 * 1000);
      const client = new KurrentDB.GRPCClient(getGRPCConfig());

      try {
        await client.projections.getState('SomeProjectionNameThatDoesNotExist');
      } catch (err) {
        // The error shape differs by server version: 26.1 reports type 'not-found', while 21.10
        // surfaces a generic 'unknown' whose message still carries the NotFound signal.
        const message = err.message.toLowerCase();
        assert(
          err.type === 'not-found' || message.includes('not found') || message.includes('notfound'),
          `Unexpected error for missing projection: ${err.type} - ${err.message}`
        );
        await client.close();
        return;
      }

      await client.close();
      assert.fail('Should have thrown a not-found error for non-existent projection');
    });

    it('Should return result for test projection', async function () {
      this.timeout(10 * 1000);
      const client = new KurrentDB.GRPCClient(getGRPCConfig());

      const projectionName = `TestProjection${generateEventId()}`;
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

      let projectionResult;
      await waitUntil(async () => {
        try {
          projectionResult = await client.projections.getResult(projectionName);
          return String(projectionResult.data) === '321';
        } catch {
          return false;
        }
      });
      assert.equal(projectionResult.data, '321');

      await client.projections.stop(projectionName);
      await waitUntil(async () => (await client.projections.getInfo(projectionName)).status === 'Stopped');
      await client.projections.remove(projectionName);

      await client.close();
    });

    it('Should return result for partitioned test projection', async function () {
      this.timeout(10 * 1000);
      const client = new KurrentDB.GRPCClient(getGRPCConfig());

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

      let projectionResult;
      await waitUntil(
        async () => {
          try {
            projectionResult = await client.projections.getResult(projectionName, options);
            return String(projectionResult.data) === '321';
          } catch {
            return false;
          }
        },
        { timeout: 8000 }
      );
      assert.equal(projectionResult.data, '321');

      await client.projections.stop(projectionName);
      await waitUntil(async () => (await client.projections.getInfo(projectionName)).status === 'Stopped');
      await client.projections.remove(projectionName);

      await client.close();
    });

    it('Should throw a not-found error for non-existent projection when requesting result', async function () {
      this.timeout(10 * 1000);
      const client = new KurrentDB.GRPCClient(getGRPCConfig());

      try {
        await client.projections.getResult('SomeProjectionNameThatDoesNotExist');
      } catch (err) {
        // The error shape differs by server version: 26.1 reports type 'not-found', while 21.10
        // surfaces a generic 'unknown' whose message still carries the NotFound signal.
        const message = err.message.toLowerCase();
        assert(
          err.type === 'not-found' || message.includes('not found') || message.includes('notfound'),
          `Unexpected error for missing projection: ${err.type} - ${err.message}`
        );
        await client.close();
        return;
      }

      await client.close();
      assert.fail('Should have thrown a not-found error for non-existent projection');
    });

    it('Should return undefined from getInfo for non-existent projection', async function () {
      this.timeout(10 * 1000);
      const client = new KurrentDB.GRPCClient(getGRPCConfig());

      const projectionInfo = await client.projections.getInfo('SomeProjectionNameThatDoesNotExist');
      assert.equal(projectionInfo, undefined);

      await client.close();
    });
  });
});
