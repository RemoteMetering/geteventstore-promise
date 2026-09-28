import assert from 'assert';
import toExpectedVersion from '../lib/utilities/toExpectedVersion.js';
import toExpectedState from '../lib/grpcClient/utilities/toExpectedState.js';

describe('toExpectedVersion - HTTP and TCP expected version mapping', () => {
  it('Should treat a missing value as Any', () => {
    assert.equal(toExpectedVersion(undefined), -2);
    assert.equal(toExpectedVersion(null), -2);
  });

  it('Should map the gRPC stream state names to the protocol numbers', () => {
    assert.equal(toExpectedVersion('any'), -2);
    assert.equal(toExpectedVersion('no_stream'), -1);
    assert.equal(toExpectedVersion('stream_exists'), -4);
  });

  it('Should accept a revision as a number, a bigint or a decimal string', () => {
    assert.equal(toExpectedVersion(0), 0);
    assert.equal(toExpectedVersion(5), 5);
    assert.equal(toExpectedVersion(5n), 5);
    assert.equal(toExpectedVersion('5'), 5);
  });

  it('Should keep the protocol sentinels', () => {
    assert.equal(toExpectedVersion(-1), -1);
    assert.equal(toExpectedVersion(-2), -2);
    assert.equal(toExpectedVersion(-4), -4);
  });

  it('Should throw rather than fall back to Any on an invalid value', () => {
    for (const value of ['WRONG', '5a', 1.5, -3, -5, {}]) {
      assert.throws(() => toExpectedVersion(value), /Invalid expectedVersion/, String(value));
    }
  });

  it('Should reject a revision HTTP and TCP cannot carry exactly', () => {
    assert.throws(() => toExpectedVersion('9007199254740993'), /Invalid expectedVersion/);
  });
});

describe('toExpectedState - gRPC expected version mapping', () => {
  it('Should map every sentinel form to the SDK stream state', () => {
    for (const value of [-1, -1n, '-1', 'no_stream']) assert.equal(toExpectedState(value), 'no_stream', String(value));
    for (const value of [-2, '-2', 'any', null, undefined]) assert.equal(toExpectedState(value), 'any', String(value));
    for (const value of [-4, -4n, '-4', 'stream_exists']) {
      assert.equal(toExpectedState(value), 'stream_exists', String(value));
    }
  });

  it('Should pass a revision to the SDK as an exact BigInt', () => {
    assert.equal(toExpectedState(5), 5n);
    assert.equal(toExpectedState('5'), 5n);
    assert.equal(toExpectedState('9007199254740993'), 9007199254740993n);
  });

  it('Should throw on the same invalid values as HTTP and TCP', () => {
    for (const value of ['WRONG', 1.5, -3, '5a']) {
      assert.throws(() => toExpectedState(value), /Invalid expectedVersion/, String(value));
    }
  });
});
