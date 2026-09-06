/**
 * Published cross-app contracts — no remote internals.
 * Transport: BroadcastChannel(BPS_CHANNEL). People publishes; Delivery consumes.
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
export type BpsMessage = RatesChangedMessage;
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
