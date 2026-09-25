import assert from 'assert';
import toExpectedVersion from '../lib/utilities/toExpectedVersion.js';

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
});
