import { loadRemote, registerRemotes } from '@module-federation/runtime';
import type { ComponentType } from 'react';
import type { HostContext } from '@bps/contracts';
import { readRemoteConfig } from './remoteConfig';

export type RemoteAppModule = {
  default?: ComponentType<{ host?: HostContext }>;
  App?: ComponentType<{ host?: HostContext }>;
};

/** Cap how long Shell waits for a remote before showing the failure panel. */
export const REMOTE_LOAD_TIMEOUT_MS = 3_000;

let remotesRegistered = false;

/** Reject if `promise` does not settle within `ms` (clears the timer on settle). */
export async function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  onTimeout: () => Error,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(onTimeout()), ms);
      }),
    ]);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}

/** Register People/Delivery entries from /config.js (once). */
export function registerRemotesFromConfig(): void {
  if (remotesRegistered) return;
  const config = readRemoteConfig();
  registerRemotes(
    [
      {
        name: 'people',
        entry: config.peopleRemoteUrl,
        type: 'module',
      },
      {
        name: 'delivery',
        entry: config.deliveryRemoteUrl,
        type: 'module',
      },
    ],
    { force: true },
  );
  remotesRegistered = true;
}

export async function loadRemoteApp(
  remote: 'people' | 'delivery',
): Promise<{ default: ComponentType<{ host?: HostContext }> }> {
  registerRemotesFromConfig();
  const mod = await withTimeout(
    loadRemote<RemoteAppModule>(`${remote}/App`),
    REMOTE_LOAD_TIMEOUT_MS,
    () =>
      new Error(
        `Remote "${remote}" did not load within ${REMOTE_LOAD_TIMEOUT_MS}ms (service may be stopped).`,
      ),
  );
  if (!mod) {
    throw new Error(`Remote "${remote}/App" returned null`);
  }
  const App = mod.default ?? mod.App;
  if (!App) {
    throw new Error(`Remote "${remote}/App" did not export App`);
  }
  return { default: App };
}
