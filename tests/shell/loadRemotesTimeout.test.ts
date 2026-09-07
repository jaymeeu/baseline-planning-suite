import { afterEach, describe, expect, it, vi } from 'vitest';
import { withTimeout } from '../../apps/shell/src/loadRemotes';

describe('withTimeout', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('resolves when the promise settles before the deadline', async () => {
    await expect(withTimeout(Promise.resolve('ok'), 1_000, () => new Error('late'))).resolves.toBe(
      'ok',
    );
  });

  it('rejects with onTimeout when the deadline elapses first', async () => {
    vi.useFakeTimers();
    const pending = withTimeout(
      new Promise<string>(() => {
        /* never settles */
      }),
      3_000,
      () => new Error('timed out'),
    );
    const assertion = expect(pending).rejects.toThrow('timed out');
    await vi.advanceTimersByTimeAsync(3_000);
    await assertion;
  });
});
