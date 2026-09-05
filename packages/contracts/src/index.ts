/**
 * Published cross-app contracts — no remote internals.
 * Event payloads and host context expand in later phases.
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
