import client from 'node-eventstore-client';
import debugModule from 'debug';
import assert from 'assert';
import { mapEvent, keepEvent } from './utilities/mapEvents.js';
import connectionManager from './connectionManager.js';

const debug = debugModule('metronomic-kurrentdb-client:subscribeToStream');
const baseErr = 'Subscribe to Stream - ';

export default (config) =>
  (streamName, onEventAppeared, onDropped, resolveLinkTos = false) =>
    new Promise((resolve, reject) => {
      const run = async () => {
        assert(streamName, `${baseErr}Stream Name not provided`);

        let connection;
        const onEvent = (sub, ev) => {
          const mappedEvent = mapEvent(ev);
          if (keepEvent(mappedEvent, config.includeDeleted)) onEventAppeared(sub, mappedEvent);
        };

        const onConnected = async () => {
          try {
            const subscription = await connection.subscribeToStream(
              streamName,
              resolveLinkTos,
              onEvent,
              onDropped,
              new client.UserCredentials(config.credentials.username, config.credentials.password)
            );

            const originalClose = subscription.close;
            subscription.close = async function releaseSubConnectionFromPool() {
              await originalClose.call(subscription);
              await connection.releaseConnection();
              await connectionManager.close(config)(connection._connectionName);
            };
            debug('', 'Subscription: %j', subscription);
            resolve(subscription);
          } catch (ex) {
            reject(ex);
          }
        };

        connection = await connectionManager.create(config, onConnected, true);
      };

      run().catch(reject);
    });
