/**
 * Published cross-app contracts — no remote internals.
 * Transport: BroadcastChannel(BPS_CHANNEL).
 * People publishes rates/changed; Delivery publishes allocations/changed.
 */
export declare const BPS_CHANNEL: "bps";
export interface ActiveUser {
    id: string;
    name: string;
}
export interface HostContext {
    currency: string;
    activeUser: ActiveUser;
}
export declare const DEFAULT_HOST_CONTEXT: HostContext;
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
export declare function isBpsMessage(data: unknown): data is BpsMessage;
/**
 * Publish a typed BPS message. Opens a short-lived channel so publishers
 * do not need to manage lifecycle.
 */
export declare function publishBpsMessage(message: BpsMessage): void;
/**
 * Subscribe to typed BPS messages. Malformed payloads are ignored.
 * Returns an unsubscribe function.
 */
export declare function subscribeBpsMessages(handler: (message: BpsMessage) => void): () => void;
