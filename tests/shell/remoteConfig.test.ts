import { describe, expect, it } from 'vitest';
import { readRemoteConfig } from '../../apps/shell/src/remoteConfig';

describe('readRemoteConfig', () => {
  it('accepts valid people and delivery URLs', () => {
    expect(
      readRemoteConfig({
        peopleRemoteUrl: 'http://localhost:8081/remoteEntry.js',
        deliveryRemoteUrl: 'http://localhost:8082/remoteEntry.js',
      }),
    ).toEqual({
      peopleRemoteUrl: 'http://localhost:8081/remoteEntry.js',
      deliveryRemoteUrl: 'http://localhost:8082/remoteEntry.js',
    });
  });

  it('trims whitespace', () => {
    expect(
      readRemoteConfig({
        peopleRemoteUrl: '  http://localhost:8081/remoteEntry.js  ',
        deliveryRemoteUrl: 'http://localhost:8082/remoteEntry.js',
      }).peopleRemoteUrl,
    ).toBe('http://localhost:8081/remoteEntry.js');
  });

  it('rejects missing config object', () => {
    expect(() => readRemoteConfig(undefined)).toThrow(/Missing runtime config/);
  });

  it('rejects empty URL strings', () => {
    expect(() =>
      readRemoteConfig({
        peopleRemoteUrl: '',
        deliveryRemoteUrl: 'http://localhost:8082/remoteEntry.js',
      }),
    ).toThrow(/Invalid runtime config/);
  });
});
