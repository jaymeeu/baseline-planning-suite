/**
 * Published cross-app contracts — no remote internals.
 * Event payloads and host context expand in later phases.
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
