import assert from 'assert';
import toRawStreamMetadata from '../lib/utilities/toRawStreamMetadata.js';

describe('toRawStreamMetadata - ACL translation', () => {
  it('Should map friendly ACL role keys to the raw $ keys', () => {
    const raw = toRawStreamMetadata({
      acl: {
        readRoles: ['reader'],
        writeRoles: ['writer'],
        deleteRoles: ['$admins'],
        metaReadRoles: ['metaReader'],
        metaWriteRoles: ['metaWriter']
      }
    });

    assert.deepEqual(raw.$acl, {
      $r: ['reader'],
      $w: ['writer'],
      $d: ['$admins'],
      $mr: ['metaReader'],
      $mw: ['metaWriter']
    });
  });

  it('Should pass a string ACL through unchanged', () => {
    const raw = toRawStreamMetadata({ acl: '$userStreamAcl' });

    assert.equal(raw.$acl, '$userStreamAcl');
  });

  it('Should skip ACL role values that are undefined', () => {
    const raw = toRawStreamMetadata({
      acl: {
        readRoles: ['reader'],
        writeRoles: undefined
      }
    });

    assert.deepEqual(raw.$acl, { $r: ['reader'] });
    assert.equal('$w' in raw.$acl, false);
  });

  it('Should drop unknown ACL keys and keep raw role keys, as the gRPC SDK does', () => {
    const originalWarn = console.warn;
    const warnings = [];
    console.warn = (message) => warnings.push(message);
    try {
      const raw = toRawStreamMetadata({ acl: { $customAcl: ['x'], bogus: 1, $r: ['reader'] } });
      assert.deepEqual(raw.$acl, { $r: ['reader'] });
      assert.equal(warnings.length, 2);
    } finally {
      console.warn = originalWarn;
    }
  });

  it('Should reject a null or non object ACL with a clear error', () => {
    assert.throws(() => toRawStreamMetadata({ acl: null }), /"acl" must be a string or an object/);
    assert.throws(() => toRawStreamMetadata({ acl: 5 }), /"acl" must be a string or an object/);
  });

  it('Should reject system values that are not integers, as the gRPC SDK does', () => {
    for (const key of ['maxAge', 'maxCount', 'truncateBefore', 'cacheControl']) {
      assert.throws(() => toRawStreamMetadata({ [key]: '60' }), new RegExp(`"${key}" must be an integer`));
    }
  });

  it('Should translate an ACL alongside system and custom properties and skip undefined ones', () => {
    const raw = toRawStreamMetadata({
      maxCount: 10,
      customField: 'abc',
      ignored: undefined,
      acl: { readRoles: ['reader'] }
    });

    assert.equal(raw.$maxCount, 10);
    assert.equal(raw.customField, 'abc');
    assert.equal('ignored' in raw, false);
    assert.deepEqual(raw.$acl, { $r: ['reader'] });
  });
});
