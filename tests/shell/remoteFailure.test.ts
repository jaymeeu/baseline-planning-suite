import { describe, expect, it } from 'vitest';
import { formatRemoteFailureMessage } from '../../apps/shell/src/remoteFailure';
import { readRemoteConfig } from '../../apps/shell/src/remoteConfig';

describe('formatRemoteFailureMessage', () => {
  it('names the remote and states Shell isolation', () => {
    const copy = formatRemoteFailureMessage('people', 'network down');
    expect(copy.title).toBe('people failed to load');
    expect(copy.detail).toBe('network down');
    expect(copy.isolationNote).toMatch(/Shell remains available/i);
    expect(copy.isolationNote).toMatch(/Other remotes are unaffected/i);
  });

  it('supports delivery remote name', () => {
    expect(formatRemoteFailureMessage('delivery', 'timeout').title).toBe(
      'delivery failed to load',
    );
  });
});

describe('readRemoteConfig — Phase 12 malformed cases', () => {
  it('rejects empty object (missing URL fields)', () => {
    expect(() => readRemoteConfig({})).toThrow(/Invalid runtime config/);
  });

  it('rejects whitespace-only URLs', () => {
    expect(() =>
      readRemoteConfig({
        peopleRemoteUrl: '   ',
        deliveryRemoteUrl: 'http://localhost:8082/remoteEntry.js',
      }),
    ).toThrow(/Invalid runtime config/);
  });
});
