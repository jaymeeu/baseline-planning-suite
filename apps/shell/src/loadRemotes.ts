import { loadRemote, registerRemotes } from '@module-federation/runtime';
import type { ComponentType } from 'react';
import type { HostContext } from '@bps/contracts';
import { readRemoteConfig } from './remoteConfig';

export type RemoteAppModule = {
  default?: ComponentType<{ host?: HostContext }>;
  App?: ComponentType<{ host?: HostContext }>;
};

let remotesRegistered = false;

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
  const mod = await loadRemote<RemoteAppModule>(`${remote}/App`);
  if (!mod) {
    throw new Error(`Remote "${remote}/App" returned null`);
  }
  const App = mod.default ?? mod.App;
  if (!App) {
    throw new Error(`Remote "${remote}/App" did not export App`);
  }
  return { default: App };
}
