import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  BPS_CHANNEL,
  isBpsMessage,
  publishBpsMessage,
  subscribeBpsMessages,
  type BpsMessage,
} from '../../packages/contracts/src/index';

class FakeBroadcastChannel {
  static channels = new Map<string, Set<FakeBroadcastChannel>>();

  readonly name: string;
  private listeners = new Set<(event: MessageEvent) => void>();

  constructor(name: string) {
    this.name = name;
    const set = FakeBroadcastChannel.channels.get(name) ?? new Set();
    set.add(this);
    FakeBroadcastChannel.channels.set(name, set);
  }

  postMessage(data: unknown): void {
    const peers = FakeBroadcastChannel.channels.get(this.name);
    if (!peers) return;
    for (const peer of peers) {
      if (peer === this) continue;
      const event = { data } as MessageEvent;
      for (const listener of peer.listeners) {
        listener(event);
      }
    }
  }

  addEventListener(
    type: string,
    listener: (event: MessageEvent) => void,
  ): void {
    if (type === 'message') this.listeners.add(listener);
  }

  removeEventListener(
    type: string,
    listener: (event: MessageEvent) => void,
  ): void {
    if (type === 'message') this.listeners.delete(listener);
  }

  close(): void {
    const set = FakeBroadcastChannel.channels.get(this.name);
    set?.delete(this);
    this.listeners.clear();
  }
}

describe('BPS contracts', () => {
  beforeEach(() => {
    FakeBroadcastChannel.channels.clear();
    vi.stubGlobal('BroadcastChannel', FakeBroadcastChannel);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('exposes the locked channel name', () => {
    expect(BPS_CHANNEL).toBe('bps');
  });

  it('accepts valid rates/changed messages and rejects junk', () => {
    const valid: BpsMessage = {
      type: 'rates/changed',
      employeeId: 'emp-okafor',
      rateId: 'rate-1',
      op: 'upsert',
      at: '2026-06-01T00:00:00.000Z',
    };
    expect(isBpsMessage(valid)).toBe(true);
    expect(isBpsMessage({ type: 'rates/changed' })).toBe(false);
    expect(isBpsMessage(null)).toBe(false);
    expect(isBpsMessage({ type: 'other', employeeId: 'x', op: 'upsert', at: 't' })).toBe(
      false,
    );
  });

  it('delivers publish to subscribers on the same channel', () => {
    const received: BpsMessage[] = [];
    const unsubscribe = subscribeBpsMessages((message) => {
      received.push(message);
    });

    publishBpsMessage({
      type: 'rates/changed',
      employeeId: 'emp-okafor',
      rateId: 'rate-1',
      op: 'upsert',
      at: '2026-06-01T00:00:00.000Z',
    });

    expect(received).toHaveLength(1);
    expect(received[0]?.employeeId).toBe('emp-okafor');
    expect(received[0]?.op).toBe('upsert');

    unsubscribe();
    publishBpsMessage({
      type: 'rates/changed',
      employeeId: 'emp-okafor',
      op: 'delete',
      at: '2026-06-01T00:00:01.000Z',
    });
    expect(received).toHaveLength(1);
  });

  it('ignores malformed channel payloads', () => {
    const received: BpsMessage[] = [];
    const unsubscribe = subscribeBpsMessages((message) => {
      received.push(message);
    });
    const channel = new FakeBroadcastChannel(BPS_CHANNEL);
    channel.postMessage({ hello: 'world' });
    expect(received).toHaveLength(0);
    unsubscribe();
    channel.close();
  });
});
