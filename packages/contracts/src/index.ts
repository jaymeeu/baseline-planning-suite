/**
 * Published cross-app contracts — no remote internals.
 * Transport: BroadcastChannel(BPS_CHANNEL).
 * People publishes rates/changed; Delivery publishes allocations/changed.
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

/**
 * Notification that Delivery allocation data changed.
 * People reloads cross-project capacity when this arrives.
 */
export interface AllocationsChangedMessage {
  type: 'allocations/changed';
  /** Employees whose capacity may have changed (empty = full refresh). */
  employeeIds: string[];
  /** ISO-8601 timestamp when the change was published. */
  at: string;
}

export type BpsMessage = RatesChangedMessage | AllocationsChangedMessage;

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

export function isBpsMessage(data: unknown): data is BpsMessage {
  if (typeof data !== 'object' || data === null) return false;
  const record = data as Record<string, unknown>;

  if (record.type === 'rates/changed') {
    if (!isNonEmptyString(record.employeeId)) return false;
    if (record.op !== 'upsert' && record.op !== 'delete') return false;
    if (!isNonEmptyString(record.at)) return false;
    if (record.rateId !== undefined && !isNonEmptyString(record.rateId)) {
      return false;
    }
    return true;
  }

  if (record.type === 'allocations/changed') {
    if (!isNonEmptyString(record.at)) return false;
    if (!Array.isArray(record.employeeIds)) return false;
    if (!record.employeeIds.every(isNonEmptyString)) return false;
    return true;
  }

  return false;
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
