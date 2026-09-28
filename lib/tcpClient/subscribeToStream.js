import client from 'node-eventstore-client';
import debugModule from 'debug';
import assert from 'assert';
import { mapEvent, keepEvent } from './utilities/mapEvents.js';
import connectionManager from './connectionManager.js';
import subscriptionCloser from './utilities/subscriptionCloser.js';

const debug = debugModule('metronomic-kurrentdb-client:subscribeToStream');
const baseErr = 'Subscribe to Stream - ';

export default (config) =>
  (streamName, onEventAppeared, onDropped, resolveLinkTos = false) =>
    new Promise((resolve, reject) => {
      const run = async () => {
        assert(streamName, `${baseErr}Stream Name not provided`);

        let connection;
        let closeSubscription;
        let dropped = false;
        const reportDropped = (sub, reason, error) => {
          if (dropped) return;
          dropped = true;
          if (onDropped) onDropped(sub, reason, error);
          if (closeSubscription)
            closeSubscription().catch((err) => debug('', 'Close after drop failed: %s', err?.message));
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
            });
        };

        const onConnected = async () => {
          let subscription;
          try {
            subscription = await connection.subscribeToStream(
              streamName,
              resolveLinkTos,
              onEvent,
              reportDropped,
              new client.UserCredentials(config.credentials.username, config.credentials.password)
            );
          } catch (ex) {
            await connection.closePool().catch((err) => debug('', 'Close after failed subscribe: %s', err?.message));
            reject(ex);
            return;
          }

          const originalClose = subscription.close;
          closeSubscription = subscriptionCloser(connection, () => originalClose.call(subscription));
          subscription.close = closeSubscription;
          debug('', 'Subscription: %j', subscription);
          resolve(subscription);
        };

        connection = await connectionManager.create(config, onConnected, true);
      };

      run().catch(reject);
    });
