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

  it('Should keep unknown ACL keys as-is', () => {
    const raw = toRawStreamMetadata({ acl: { $customAcl: ['x'] } });

    assert.deepEqual(raw.$acl, { $customAcl: ['x'] });
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
