import assert from 'assert';
import { toAllPosition, toStreamRevision, splitPersistentSettings } from '../lib/grpcClient/utilities/positions.js';

describe('gRPC Client - position helpers', () => {
  it('Should parse a $all position from numbers, BigInts or decimal strings', () => {
    assert.deepEqual(toAllPosition({ commit: 5, prepare: '6' }, 'E - '), { commit: 5n, prepare: 6n });
    assert.deepEqual(toAllPosition({ commit: 5n, prepare: 6n }, 'E - '), { commit: 5n, prepare: 6n });
    assert.equal(toAllPosition('start', 'E - '), 'start');
    assert.equal(toAllPosition('end', 'E - '), 'end');
  });

  it('Should reject a $all position that is not start, end or a whole commit and prepare pair', () => {
    for (const value of ['middle', { commit: 5 }, { commit: 'x', prepare: 1 }, 5]) {
      assert.throws(() => toAllPosition(value, 'E - '), /'startPosition' not valid/, JSON.stringify(value));
    }
  });

  it('Should parse a stream revision to a BigInt and reject anything else', () => {
    assert.equal(toStreamRevision(5, 'E - '), 5n);
    assert.equal(toStreamRevision('9007199254740993', 'E - '), 9007199254740993n);
    assert.equal(toStreamRevision('end', 'E - '), 'end');
    for (const value of [-1, 1.5, 'abc']) assert.throws(() => toStreamRevision(value, 'E - '), /not valid/);
  });

  it('Should split persistent settings without mutating the caller object', () => {
    const filter = { filterOn: 'eventType' };
    const input = { startPosition: 'end', startFrom: 'start', filter, messageTimeout: 1000 };
    const { filter: split, settings } = splitPersistentSettings(input, toAllPosition, 'E - ');

    assert.strictEqual(split, filter);
    assert.deepEqual(settings, { startFrom: 'end', messageTimeout: 1000 });
    assert.deepEqual(input, { startPosition: 'end', startFrom: 'start', filter, messageTimeout: 1000 });
  });

  it('Should default startFrom to start and parse a string $all position', () => {
    assert.equal(splitPersistentSettings(undefined, toAllPosition, 'E - ').settings.startFrom, 'start');
    const { settings } = splitPersistentSettings({ startFrom: { commit: '7', prepare: '7' } }, toAllPosition, 'E - ');
    assert.deepEqual(settings.startFrom, { commit: 7n, prepare: 7n });
  });
});
