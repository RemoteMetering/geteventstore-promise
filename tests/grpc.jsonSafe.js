import assert from 'assert';
import { toPlainJson, jsonSafe, safePosition } from '../lib/grpcClient/utilities/jsonSafe.js';

describe('gRPC Client - toPlainJson', () => {
  it('Should turn a BigInt into a decimal string that round-trips', () => {
    assert.equal(toPlainJson(42n), '42');
    assert.equal(BigInt(toPlainJson(9007199254740993n)), 9007199254740993n, 'no precision lost above 2^53');
  });

  it('Should recurse nested objects and arrays', () => {
    const plain = toPlainJson({ a: 1n, b: [{ c: 2n }], d: 'x' });
    assert.deepEqual(plain, { a: '1', b: [{ c: '2' }], d: 'x' });
  });

  it('Should leave Dates, typed arrays and primitives alone', () => {
    const date = new Date('2020-09-13T12:26:40.000Z');
    const bytes = new Uint8Array([1, 2]);
    const plain = toPlainJson({ date, bytes, n: 1, s: 'x', b: true, nil: null });

    assert.equal(plain.date, date);
    assert.equal(plain.bytes, bytes);
    assert.deepEqual(
      { ...plain, date: undefined, bytes: undefined },
      {
        date: undefined,
        bytes: undefined,
        n: 1,
        s: 'x',
        b: true,
        nil: null
      }
    );
  });
});

describe('gRPC Client - jsonSafe', () => {
  it('Should make an object holding a BigInt serialisable', () => {
    const info = jsonSafe({ groupName: 'g', bufferedEvents: 5n });
    assert.deepEqual(JSON.parse(JSON.stringify(info)), { groupName: 'g', bufferedEvents: '5' });
  });

  it('Should keep the BigInt on the object itself', () => {
    const info = jsonSafe({ bufferedEvents: 5n });
    assert.equal(typeof info.bufferedEvents, 'bigint');
  });

  it('Should narrow nested BigInts at every level when the whole object is serialised', () => {
    // The shape the SDK returns for a stream persistent subscription, BigInts at three levels.
    const info = jsonSafe({
      groupName: 'g',
      settings: { startFrom: 1234567890123n, maxRetryCount: 10 },
      stats: { totalItems: 42n, parkedMessageCount: 3n, readBufferCount: 5 },
      connections: [{ from: 'tcp://10.0.0.1', totalItems: 7n, availableSlots: 8 }]
    });

    const plain = JSON.parse(JSON.stringify(info));
    assert.equal(plain.settings.startFrom, '1234567890123');
    assert.equal(plain.stats.totalItems, '42');
    assert.equal(plain.connections[0].totalItems, '7');
    assert.equal(plain.stats.readBufferCount, 5, 'plain numbers are left as numbers');
  });

  it('Should keep full precision above 2^53', () => {
    const info = jsonSafe({ stats: { totalItems: 9007199254740993n } });
    const plain = JSON.parse(JSON.stringify(info));

    assert.equal(plain.stats.totalItems, '9007199254740993');
    assert.equal(BigInt(plain.stats.totalItems), 9007199254740993n, 'the string round-trips exactly');
  });

  it('Should make an array of objects serialisable', () => {
    const infos = jsonSafe([{ version: 1n }, { version: 2n }]);
    assert.equal(JSON.stringify(infos), '[{"version":"1"},{"version":"2"}]');
  });

  // projections.getInfo returns one entry out of getAllProjectionsInfo, so entries need their own hook
  it('Should make each entry of an info list serialisable on its own', () => {
    const infos = jsonSafe([
      { name: 'a', version: 1n },
      { name: 'b', version: 2n }
    ]);

    assert.equal(JSON.stringify(infos[0]), '{"name":"a","version":"1"}');
    const found = infos.find((info) => info.name === 'b');
    assert.equal(JSON.stringify(found), '{"name":"b","version":"2"}');
  });

  it('Should be harmless on an object holding no BigInt', () => {
    const clean = jsonSafe({ a: 1, b: 'x', nested: { c: true } });

    assert.deepEqual(JSON.parse(JSON.stringify(clean)), { a: 1, b: 'x', nested: { c: true } });
    assert.deepEqual(Object.keys(clean), ['a', 'b', 'nested']);
  });

  // Attaching to anything object-ish would shadow Date.prototype.toJSON and serialise it as {}.
  it('Should leave a Date alone rather than shadowing its own toJSON', () => {
    const date = new Date('2020-09-13T12:26:40.000Z');

    assert.equal(jsonSafe(date), date);
    assert.equal(JSON.stringify(jsonSafe(date)), '"2020-09-13T12:26:40.000Z"');
  });

  it('Should leave a Map alone, and still serialise a Date held inside an object', () => {
    const map = new Map([['mean', 5n]]);
    assert.equal(jsonSafe(map), map);

    const wrapped = jsonSafe({ when: new Date('2020-09-13T12:26:40.000Z'), total: 5n });
    assert.equal(JSON.stringify(wrapped), '{"when":"2020-09-13T12:26:40.000Z","total":"5"}');
  });

  it('Should keep toJSON off the enumerable keys', () => {
    const info = jsonSafe({ a: 1, bufferedEvents: 5n });
    assert.deepEqual(Object.keys(info), ['a', 'bufferedEvents']);
  });

  it('Should return the value it was given rather than a copy', () => {
    const info = { version: 1n };
    assert.equal(jsonSafe(info), info);
  });

  it('Should pass null and undefined through untouched', () => {
    assert.equal(jsonSafe(null), null);
    assert.equal(jsonSafe(undefined), undefined);
  });
});

describe('gRPC Client - safePosition', () => {
  it('Should keep the commit and prepare BigInts but serialise them as strings', () => {
    const position = safePosition({ commit: 42n, prepare: 43n });

    assert.equal(typeof position.commit, 'bigint');
    assert.deepEqual(position, { commit: 42n, prepare: 43n });
    assert.equal(JSON.stringify(position), '{"commit":"42","prepare":"43"}');
  });

  it('Should not mutate the position the SDK supplied', () => {
    const original = { commit: 42n, prepare: 43n };
    safePosition(original);
    assert.equal('toJSON' in original, false);
  });
});
