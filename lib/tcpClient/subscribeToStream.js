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
        let dropped = false;
        const reportDropped = (sub, reason, error) => {
          if (dropped) return;
          dropped = true;
          if (onDropped) onDropped(sub, reason, error);
        };
        const onEvent = (sub, ev) => {
          if (dropped) return undefined;
          return Promise.resolve()
            .then(() => {
              const mappedEvent = mapEvent(ev);
              if (!onEventAppeared || !keepEvent(mappedEvent, config.includeDeleted)) return undefined;
              return onEventAppeared(sub, mappedEvent);
            })
            .catch((err) => {
              debug('', 'Event handler failed, dropping subscription: %s', err?.message);
              reportDropped(sub, 'eventHandlerException', err);
              return sub.close();
            });
        };

        const onConnected = async () => {
          try {
            const subscription = await connection.subscribeToStream(
              streamName,
              resolveLinkTos,
              onEvent,
              reportDropped,
              new client.UserCredentials(config.credentials.username, config.credentials.password)
            );

            const originalClose = subscription.close;
            subscription.close = async function releaseSubConnectionFromPool() {
              await originalClose.call(subscription);
              await connection.releaseConnection();
              await connection.closePool();
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
