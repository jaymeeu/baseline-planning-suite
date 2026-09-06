/**
 * Published cross-app contracts — no remote internals.
 * Transport: BroadcastChannel(BPS_CHANNEL). People publishes; Delivery consumes.
 */

export const BPS_CHANNEL = 'bps' as const;

export interface ActiveUser {
  id: string;
  name: string;
}

export interface HostContext {
  currency: string;
  activeUser: ActiveUser;
}

export const DEFAULT_HOST_CONTEXT: HostContext = {
  currency: 'EUR',
  activeUser: {
    id: 'user-demo',
    name: 'Demo User',
  },
};

/** Notification that People rate data changed for an employee. */
export interface RatesChangedMessage {
  type: 'rates/changed';
  employeeId: string;
  rateId?: string;
  op: 'upsert' | 'delete';
  /** ISO-8601 timestamp when the change was published. */
  at: string;
}

export type BpsMessage = RatesChangedMessage;

export function isBpsMessage(data: unknown): data is BpsMessage {
  if (typeof data !== 'object' || data === null) return false;
  const record = data as Record<string, unknown>;
  if (record.type !== 'rates/changed') return false;
  if (typeof record.employeeId !== 'string' || record.employeeId.length === 0) {
    return false;
  }
  if (record.op !== 'upsert' && record.op !== 'delete') return false;
  if (typeof record.at !== 'string' || record.at.length === 0) return false;
  if (
    record.rateId !== undefined &&
    (typeof record.rateId !== 'string' || record.rateId.length === 0)
  ) {
    return false;
  }
  return true;
}

function requireBroadcastChannel(): typeof BroadcastChannel {
  if (typeof BroadcastChannel === 'undefined') {
    throw new Error('BroadcastChannel is not available in this environment');
  }
  return BroadcastChannel;
}

/**
 * Publish a typed BPS message. Opens a short-lived channel so publishers
 * do not need to manage lifecycle.
 */
export function publishBpsMessage(message: BpsMessage): void {
  if (!isBpsMessage(message)) {
    throw new Error('Invalid BPS message');
  }
  const Channel = requireBroadcastChannel();
  const channel = new Channel(BPS_CHANNEL);
  try {
    channel.postMessage(message);
  } finally {
    channel.close();
  }
}

/**
 * Subscribe to typed BPS messages. Malformed payloads are ignored.
 * Returns an unsubscribe function.
 */
export function subscribeBpsMessages(
  handler: (message: BpsMessage) => void,
): () => void {
  const Channel = requireBroadcastChannel();
  const channel = new Channel(BPS_CHANNEL);
  const onMessage = (event: MessageEvent) => {
    if (isBpsMessage(event.data)) {
      handler(event.data);
    }
  };
  channel.addEventListener('message', onMessage);
  return () => {
    channel.removeEventListener('message', onMessage);
    channel.close();
  };
}
